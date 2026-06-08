import { createClient } from "@supabase/supabase-js";
import { TceClient, type TceQueryParams } from "./client.js";
import { getEndpointConfig } from "./endpoints.js";
import { requiredEnv } from "./env.js";
import { createNaturalKey } from "./keys.js";
import { ensureGroupSubscriptions, loadGroupEndpoints } from "./group.js";
import { buildCompetencias } from "./competencias.js";

export type SyncOptions = {
  endpoint: string;
  municipio?: string;
  exercicio?: string;
  dataReferencia?: string;
  orgao?: string;
  unidadeOrcamentaria?: string;
  dryRun?: boolean;
  force?: boolean;
  maxPages?: number;
};

export type SyncGrupoOptions = {
  municipio: string;
  grupo: string;
  exercicio: string;
  dataReferencia?: string;
  dataInicial?: string;
  dataFinal?: string;
  onlyDefault?: boolean;
  force?: boolean;
  maxPages?: string;
};

export type SyncContasBancariasOptions = {
  municipio: string;
  exercicio: string;
  force?: boolean;
  maxOrgaos?: number;
};

export async function runSyncTce(options: SyncOptions, onLog?: (msg: string) => void): Promise<void> {
  const config = getEndpointConfig(options.endpoint);
  const tce = new TceClient();
  const queryParams = buildQueryParams(config, options);
  validateRequiredParams(config, queryParams);

  const supabase = options.dryRun
    ? null
    : createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false, autoRefreshToken: false }
      });

  let totalRows = 0;
  let pageCount = 0;

  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  log(`Endpoint: ${config.endpoint}`);
  log(`Tabela destino: ${config.table}`);
  log(`Modo: ${options.dryRun ? "dry-run, sem gravar" : "gravacao no Supabase"}`);
  log(`Parametros: ${JSON.stringify(queryParams)}`);

  const skipExistingSync = !options.dryRun && !options.force && supabase && (await hasSuccessfulSync(supabase, config.endpoint, queryParams));

  if (skipExistingSync) {
    log("Sincronizacao ja concluida para este escopo. Use --force para baixar novamente e aplicar upsert.");
  }

  if (!skipExistingSync) {
    for await (const page of tce.paginate(config.endpoint, queryParams)) {
      pageCount += 1;
      totalRows += page.rows.length;

      log(`Pagina ${pageCount}: start_index=${page.startIndex}, registros=${page.rows.length}`);

      if (!options.dryRun && supabase) {
        const syncLogId = await startSyncLog(supabase, config.endpoint, queryParams, page.startIndex, page.rows.length, page.url);

        try {
          await upsertRows(supabase, config.table, config.endpoint, options, page.rows, page.url, page.startIndex);
          await finishSyncLog(supabase, syncLogId, "ok");
        } catch (error) {
          await finishSyncLog(supabase, syncLogId, "error", error);
          throw error;
        }
      }

      if (options.maxPages && pageCount >= options.maxPages) {
        log(`Parando por limite --max-pages=${options.maxPages}`);
        break;
      }
    }
  }

  log(`Finalizado. Paginas=${pageCount}; registros=${totalRows}`);
}

async function upsertRows(
  supabase: any,
  table: string,
  configEndpoint: string,
  options: SyncOptions,
  rows: Record<string, unknown>[],
  sourceUrl: string,
  startIndex: number
) {
  if (!supabase || rows.length === 0) {
    return;
  }

  if (table === "municipios") {
    const payload = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio),
      nome_municipio: asText(row.nome_municipio ?? row.descricao_municipio ?? row.nome),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from("municipios").upsert(payload, {
      onConflict: "codigo_municipio"
    });

    if (error) {
      throw error;
    }
  }

  if (table === "tce_balancetes_receitas_orcamentarias") {
    const payload = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento),
      codigo_orgao: asText(row.codigo_orgao),
      codigo_unidade_orcamentaria: asText(row.codigo_unidade_orcamentaria),
      codigo_rubrica: asText(row.codigo_rubrica),
      data_referencia_doc: asText(row.data_referencia_doc),
      tipo_balancete: nullableText(row.tipo_balancete),
      valor_previsto_orcamento: nullableNumber(row.valor_previsto_orcamento),
      valor_anulacoes_no_mes: nullableNumber(row.valor_anulacoes_no_mes),
      valor_arrecadacao_no_mes: nullableNumber(row.valor_arrecadacao_no_mes),
      valor_arrecadacao_ate_mes: nullableNumber(row.valor_arrecadacao_ate_mes),
      valor_anulacoes_ate_mes: nullableNumber(row.valor_anulacoes_ate_mes),
      tipo_fonte: nullableText(row.tipo_fonte),
      codigo_fonte: asText(row.codigo_fonte),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from(table).upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria,codigo_rubrica,data_referencia_doc,codigo_fonte"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_orgaos") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      nome_orgao: nullableText(row.nome_orgao),
      cgc_orgao: nullableText(row.cgc_orgao),
      codigo_tipo_unidade: nullableText(row.codigo_tipo_unidade),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [row.codigo_municipio, row.exercicio_orcamento, row.codigo_orgao].join("|")
    );

    const { error } = await supabase.from("tce_orgaos").upsert(payload, {
      onConflict: "codigo_municipio,exercicio_orcamento,codigo_orgao"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_funcoes") {
    const payload = dedupeByKey(
      rows.map((row) => ({
        codigo_funcao: trimText(row.codigo_funcao),
        nome_funcao: nullableText(row.nome_funcao)?.trim() ?? null,
        payload: row,
        updated_at: new Date().toISOString()
      })),
      (row) => row.codigo_funcao
    );

    const { error } = await supabase.from("tce_funcoes").upsert(payload, {
      onConflict: "codigo_funcao"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_tipos_unidades_administrativas") {
    const payload = dedupeByKey(
      rows.map((row) => ({
        codigo_tipo_unidade_administrativa: trimText(row.codigo_tipo_unidade_administrativa),
        nome_tipo_unidade_administrativa: nullableText(row.nome_tipo_unidade_administrativa)?.trim() ?? null,
        payload: row,
        updated_at: new Date().toISOString()
      })),
      (row) => row.codigo_tipo_unidade_administrativa
    );

    const { error } = await supabase.from("tce_tipos_unidades_administrativas").upsert(payload, {
      onConflict: "codigo_tipo_unidade_administrativa"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_unidades_orcamentarias") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      nome_unidade: nullableText(row.nome_unidade),
      codigo_tipo_unidade: nullableText(row.codigo_tipo_unidade),
      tipo_administracao_unidade: nullableText(row.tipo_administracao_unidade),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [row.codigo_municipio, row.exercicio_orcamento, row.codigo_orgao, row.codigo_unidade_orcamentaria].join("|")
    );

    const { error } = await supabase.from("tce_unidades_orcamentarias").upsert(payload, {
      onConflict: "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_unidades_gestoras") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: nullableText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_unidade_gestora: trimText(row.codigo_unidade_gestora),
      nome_unidade_gestora: nullableText(row.nome_unidade_gestora),
      numero_lei_criacao: nullableText(row.numero_lei_criacao),
      data_criacao_ug: nullableDate(row.data_criacao_ug),
      data_extincao_ug: nullableDate(row.data_extincao_ug),
      data_inclusao_uo: nullableDate(row.data_inclusao_uo),
      data_exclusao_uo: nullableDate(row.data_exclusao_uo),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_unidade_gestora
      ].join("|")
    );

    const { error } = await supabase.from("tce_unidades_gestoras").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,codigo_unidade_gestora"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_ordenadores_despesas") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: nullableText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_unidade_gestora: trimText(row.codigo_unidade_gestora),
      nome_ordenador: nullableText(row.nome_ordenador),
      cpf_ordenador: nullableText(row.cpf_ordenador),
      tipo_cargo: nullableText(row.tipo_cargo),
      codigo_vinculo: nullableText(row.codigo_vinculo),
      codigo_ingresso: nullableText(row.codigo_ingresso),
      numero_expediente_nomeacao: nullableText(row.numero_expediente_nomeacao),
      data_inicio_gestao_ordenador: nullableDate(row.data_inicio_gestao_ordenador),
      data_fim_gestao_ordenador: nullableDate(row.data_fim_gestao_ordenador),
      data_inclusao_unidade_orcamentaria: nullableDate(row.data_inclusao_unidade_orcamentaria),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_unidade_gestora,
        row.nome_ordenador,
        row.data_inicio_gestao_ordenador
      ].join("|")
    );

    const { error } = await supabase.from("tce_ordenadores_despesas").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,codigo_unidade_gestora,nome_ordenador,data_inicio_gestao_ordenador"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_contas_bancarias_municipio") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: nullableText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      numero_banco: trimText(row.numero_banco),
      numero_agencia: trimText(row.numero_agencia),
      numero_conta: trimText(row.numero_conta),
      tipo_conta: nullableText(row.tipo_conta),
      codigo_funcao_conta: nullableText(row.codigo_funcao_conta),
      data_abertura_conta: nullableDate(row.data_abertura_conta),
      valor_saldo_abertura: nullableNumber(row.valor_saldo_abertura),
      descricao_objetivo_conta: nullableText(row.descricao_objetivo_conta),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.numero_banco,
        row.numero_agencia,
        row.numero_conta
      ].join("|")
    );

    const { error } = await supabase.from("tce_contas_bancarias_municipio").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,numero_banco,numero_agencia,numero_conta"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_orcamentos_receitas") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_rubrica: trimText(row.codigo_rubrica),
      valor_previsto_orcamento: nullableNumber(row.valor_previsto ?? row.valor_previsto_orcamento),
      tipo_fonte: nullableText(row.tipo_fonte),
      codigo_fonte: trimText(row.codigo_fonte),
      descricao_rubrica: nullableText(row.descricao_rubrica),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_rubrica,
        row.codigo_fonte
      ].join("|")
    );

    const { error } = await supabase.from("tce_orcamentos_receitas").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria,codigo_rubrica,codigo_fonte"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_orcamentos_despesas") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_elemento_despesa: trimText(row.codigo_elemento_despesa),
      nome_elemento_despesa: nullableText(row.nome_elemento_despesa),
      valor_total_fixado: nullableNumber(row.valor_total_fixado),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_elemento_despesa
      ].join("|")
    );

    const { error } = await supabase.from("tce_orcamentos_despesas").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria,codigo_elemento_despesa"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_orcamentos_despesas_projetos_atividades") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_funcao: trimText(row.codigo_funcao),
      codigo_subfuncao: trimText(row.codigo_subfuncao),
      codigo_programa: trimText(row.codigo_programa),
      codigo_tipo_orcamento: trimText(row.codigo_tipo_orcamento),
      codigo_projeto_atividade: trimText(row.codigo_projeto_atividade),
      numero_projeto_atividade: trimText(row.numero_projeto_atividade),
      numero_subprojeto_atividade: trimText(row.numero_subprojeto_atividade),
      nome_projeto_atividade: nullableText(row.nome_projeto_atividade),
      descricao_projeto_atividade: nullableText(row.descricao_projeto_atividade),
      valor_total_fixado_projeto_atividade: nullableNumber(row.valor_total_fixado_projeto_atividade),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_funcao,
        row.codigo_subfuncao,
        row.codigo_programa,
        row.codigo_tipo_orcamento,
        row.codigo_projeto_atividade,
        row.numero_projeto_atividade,
        row.numero_subprojeto_atividade
      ].join("|")
    );

    const { error } = await supabase.from("tce_orcamentos_despesas_projetos_atividades").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria,codigo_funcao,codigo_subfuncao,codigo_programa,codigo_tipo_orcamento,codigo_projeto_atividade,numero_projeto_atividade,numero_subprojeto_atividade"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_dados_orcamentos") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_envio_loa: nullableDate(row.data_envio_loa),
      nu_lei_orcamento: nullableText(row.nu_lei_orcamento),
      data_aprovacao_loa: nullableDate(row.data_aprovacao_loa),
      data_publicacao_loa: nullableDate(row.data_publicacao_loa),
      percentual_supl_orcamento: nullableNumber(row.percentual_supl_orcamento),
      valor_total_supl_orcamento: nullableNumber(row.valor_total_supl_orcamento),
      valor_total_fixado_orcamento: nullableNumber(row.valor_total_fixado_orcamento),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) => `${row.codigo_municipio}|${row.exercicio_orcamento}`);

    const { error } = await supabase.from("tce_dados_orcamentos").upsert(payload, {
      onConflict: "codigo_municipio,exercicio_orcamento"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_programas_governo") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_programa: trimText(row.codigo_programa),
      numero_programa: nullableText(row.numero_programa ?? row.nome_programa),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [row.codigo_municipio, row.exercicio_orcamento, row.codigo_programa].join("|")
    );

    const { error } = await supabase.from("tce_programas_governo").upsert(payload, {
      onConflict: "codigo_municipio,exercicio_orcamento,codigo_programa"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_elementos_despesas_projetos_atividades") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_funcao: trimText(row.codigo_funcao),
      codigo_subfuncao: trimText(row.codigo_subfuncao),
      codigo_programa: trimText(row.codigo_programa),
      codigo_projeto_atividade: trimText(row.codigo_projeto_atividade),
      numero_projeto_atividade: trimText(row.numero_projeto_atividade),
      numero_subprojeto_atividade: trimText(row.numero_subprojeto_atividade),
      codigo_elemento_despesa: trimText(row.codigo_elemento_despesa),
      tipo_fonte: nullableText(row.tipo_fonte),
      codigo_fonte: trimText(row.codigo_fonte),
      valor_atual_categoria_economica: nullableNumber(row.valor_atual_categoria_economica),
      valor_orcado_categoria_economica: nullableNumber(row.valor_orcado_categoria_economica),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_funcao,
        row.codigo_subfuncao,
        row.codigo_programa,
        row.codigo_projeto_atividade,
        row.numero_projeto_atividade,
        row.numero_subprojeto_atividade,
        row.codigo_elemento_despesa,
        row.codigo_fonte
      ].join("|")
    );

    const { error } = await supabase.from("tce_elementos_despesas_projetos_atividades").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,codigo_orgao,codigo_unidade_orcamentaria,codigo_funcao,codigo_subfuncao,codigo_programa,codigo_projeto_atividade,numero_projeto_atividade,numero_subprojeto_atividade,codigo_elemento_despesa,codigo_fonte"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_balancetes_despesas_orcamentarias") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: asText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_funcao: trimText(row.codigo_funcao),
      codigo_subfuncao: trimText(row.codigo_subfuncao),
      codigo_programa: trimText(row.codigo_programa),
      codigo_projeto_atividade: trimText(row.codigo_projeto_atividade),
      numero_projeto_atividade: trimText(row.numero_projeto_atividade),
      numero_subprojeto_atividade: trimText(row.numero_subprojeto_atividade),
      codigo_elemento_despesa: trimText(row.codigo_elemento_despesa),
      tipo_balancete: nullableText(row.tipo_balancete),
      tipo_fonte: nullableText(row.tipo_fonte),
      codigo_fonte: trimText(row.codigo_fonte),
      valor_fixado_orcamento: nullableNumber(row.valor_fixado_orcamento_bal_despesa),
      valor_suplementado_no_mes: nullableNumber(row.valor_suplementado_no_mes),
      valor_suplementado_ate_mes: nullableNumber(row.valor_suplementado_ate_mes),
      valor_anulacoes_dotacao_ate_mes: nullableNumber(row.valor_anulacoes_dotacao_ate_mes),
      valor_anulacoes_empenhos_no_mes: nullableNumber(row.valor_anulacoes_empenhos_no_mes),
      valor_anulacoes_empenhos_ate_mes: nullableNumber(row.valor_anulacoes_empenhos_ate_mes),
      valor_empenhado_no_mes: nullableNumber(row.valor_empenhado_no_mes),
      valor_empenhado_ate_mes: nullableNumber(row.valor_empenhado_ate_mes),
      valor_liquidado_no_mes: nullableNumber(row.valor_liquidado_no_mes),
      valor_liquidado_ate_mes: nullableNumber(row.valor_liquidado_ate_mes),
      valor_pago_no_mes: nullableNumber(row.valor_pago_no_mes),
      valor_pago_ate_mes: nullableNumber(row.valor_pago_ate_mes),
      valor_empenhado_pagar: nullableNumber(row.valor_empenhado_pagar),
      valor_estornos_liquidacao_no_mes: nullableNumber(row.valor_estornos_liquidacao_no_mes),
      valor_estornos_liquidacao_ate_mes: nullableNumber(row.valor_estornos_liquidacao_ate_mes),
      valor_estornos_pagos_no_mes: nullableNumber(row.valor_estornos_pagos_no_mes),
      valor_estornos_pagos_ate_mes: nullableNumber(row.valor_estornos_pagos_ate_mes),
      valor_saldo_dotacao: nullableNumber(row.valor_saldo_dotacao),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_funcao,
        row.codigo_subfuncao,
        row.codigo_programa,
        row.codigo_projeto_atividade,
        row.numero_projeto_atividade,
        row.numero_subprojeto_atividade,
        row.codigo_elemento_despesa,
        row.codigo_fonte
      ].join("|")
    );

    const { error } = await supabase.from("tce_balancetes_despesas_orcamentarias").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,codigo_funcao,codigo_subfuncao,codigo_programa,codigo_projeto_atividade,numero_projeto_atividade,numero_subprojeto_atividade,codigo_elemento_despesa,codigo_fonte"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_balancetes_receitas_extra_orcamentarias") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: asText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_conta_extraorcamentaria: trimText(row.codigo_conta_extraorcamentaria),
      tipo_balancete: nullableText(row.tipo_balancete),
      valor_anulacoes_no_mes: nullableNumber(row.valor_anulacoes_no_mes),
      valor_anulacoes_ate_mes: nullableNumber(row.valor_anulacoes_ate_mes),
      valor_arrecadacao_no_mes: nullableNumber(row.valor_arrecadacao_no_mes),
      valor_arrecadacao_ate_mes: nullableNumber(row.valor_arrecadacao_ate_mes),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_conta_extraorcamentaria
      ].join("|")
    );

    const { error } = await supabase.from("tce_balancetes_receitas_extra_orcamentarias").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,codigo_conta_extraorcamentaria"
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (table === "tce_balancetes_despesas_extra_orcamentarias") {
    const mappedRows = rows.map((row) => ({
      codigo_municipio: asText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: asText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: asText(row.data_referencia_doc ?? options.dataReferencia),
      codigo_orgao: trimText(row.codigo_orgao),
      codigo_unidade_orcamentaria: trimText(row.codigo_unidade_orcamentaria),
      codigo_conta_extraorcamentaria: trimText(row.codigo_conta_extraorcamentaria),
      tipo_balancete: nullableText(row.tipo_balancete),
      valor_pago_no_mes: nullableNumber(row.valor_pago_no_mes),
      valor_pago_ate_mes: nullableNumber(row.valor_pago_ate_mes),
      valor_anulacoes_no_mes: nullableNumber(row.valor_anulacoes_no_mes),
      valor_anulacoes_ate_mes: nullableNumber(row.valor_anulacoes_ate_mes ?? row.vl_anulacao_ate_mes_bde),
      payload: row,
      updated_at: new Date().toISOString()
    }));

    const payload = dedupeByKey(mappedRows, (row) =>
      [
        row.codigo_municipio,
        row.exercicio_orcamento,
        row.data_referencia_doc,
        row.codigo_orgao,
        row.codigo_unidade_orcamentaria,
        row.codigo_conta_extraorcamentaria
      ].join("|")
    );

    const { error } = await supabase.from("tce_balancetes_despesas_extra_orcamentarias").upsert(payload, {
      onConflict:
        "codigo_municipio,exercicio_orcamento,data_referencia_doc,codigo_orgao,codigo_unidade_orcamentaria,codigo_conta_extraorcamentaria"
    });

    if (error) {
      throw error;
    }

    return;
  }

  const payload = dedupeByKey(
    rows.map((row, index) => ({
      endpoint: configEndpoint,
      codigo_municipio: nullableText(row.codigo_municipio ?? options.municipio),
      exercicio_orcamento: nullableText(row.exercicio_orcamento ?? options.exercicio),
      data_referencia_doc: nullableText(row.data_referencia_doc ?? options.dataReferencia),
      natural_key: createNaturalKey(row, startIndex + index),
      payload: row,
      source_url: sourceUrl,
      updated_at: new Date().toISOString()
    })),
    (row) => `${row.endpoint}|${row.natural_key}`
  );

  const { error } = await supabase.from("tce_raw_records").upsert(payload, {
    onConflict: "endpoint,natural_key"
  });

  if (error) {
    throw error;
  }
}

async function startSyncLog(
  supabase: any,
  configEndpoint: string,
  queryParams: TceQueryParams,
  startIndex: number,
  rowsReceived: number,
  sourceUrl: string
): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error: insertError } = await supabase
    .from("tce_sync_log")
    .insert({
      endpoint: configEndpoint,
      codigo_municipio: nullableText(queryParams.codigo_municipio),
      exercicio_orcamento: nullableText(queryParams.exercicio_orcamento),
      data_referencia_doc: nullableText(queryParams.data_referencia_doc),
      start_index: startIndex,
      count_requested: 1000,
      rows_received: rowsReceived,
      status: "started",
      source_url: sourceUrl
    })
    .select("id")
    .single();

  if (insertError) {
    console.warn(`Falha ao gravar sync_log: ${insertError.message}`);
    return null;
  }

  return data.id;
}

async function finishSyncLog(supabase: any, id: string | null, status: "ok" | "error", error?: unknown) {
  if (!supabase || !id) {
    return;
  }

  const { error: updateError } = await supabase.from("tce_sync_log").update({
    status,
    error_message: error instanceof Error ? error.message : error ? String(error) : null,
    finished_at: new Date().toISOString()
  }).eq("id", id);

  if (updateError) {
    console.warn(`Falha ao atualizar sync_log: ${updateError.message}`);
  }
}

async function hasSuccessfulSync(supabase: any, configEndpoint: string, queryParams: TceQueryParams): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  let query = supabase
    .from("tce_sync_log")
    .select("id")
    .eq("endpoint", configEndpoint)
    .eq("status", "ok")
    .not("finished_at", "is", null)
    .limit(1);

  query = applyNullableFilter(query, "codigo_municipio", queryParams.codigo_municipio);
  query = applyNullableFilter(query, "exercicio_orcamento", queryParams.exercicio_orcamento);
  query = applyNullableFilter(query, "data_referencia_doc", queryParams.data_referencia_doc);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return Boolean(data?.length);
}

function applyNullableFilter<T>(
  query: T,
  column: string,
  value: string | number | undefined
): T {
  const builder = query as {
    eq: (column: string, value: string) => T;
    is: (column: string, value: null) => T;
  };

  if (value === undefined || value === "") {
    return builder.is(column, null);
  }

  return builder.eq(column, String(value));
}

export async function runSyncGrupo(options: SyncGrupoOptions, onLog?: (msg: string) => void): Promise<void> {
  const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const competencias = buildCompetencias(options.exercicio, {
    dataReferencia: options.dataReferencia,
    dataInicial: options.dataInicial,
    dataFinal: options.dataFinal
  });

  const endpoints = await loadGroupEndpoints(supabase, options.grupo, options.onlyDefault);
  await ensureGroupSubscriptions(supabase, options.municipio, options.exercicio, endpoints);

  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  log(
    `Sincronizando grupo=${options.grupo}; municipio=${options.municipio}; exercicio=${options.exercicio}; competencias=${competencias.join(",")}; endpoints=${endpoints.length}`
  );

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const endpoint of endpoints) {
    if (endpoint.endpoint === "contas_bancarias_municipio") {
      try {
        await runSyncContasBancarias({
          municipio: options.municipio,
          exercicio: options.exercicio,
          force: options.force
        }, onLog);
        successCount += 1;
      } catch (err) {
        errorCount += 1;
      }
      continue;
    }

    const endpointCompetencias = endpoint.frequencia_sugerida === "mensal" ? competencias : [undefined];

    for (const competencia of endpointCompetencias) {
      try {
        await runSyncTce({
          endpoint: endpoint.endpoint,
          municipio: options.municipio,
          exercicio: options.exercicio,
          dataReferencia: competencia ? String(competencia) : undefined,
          force: options.force,
          maxPages: options.maxPages ? Number(options.maxPages) : undefined
        }, onLog);
        successCount += 1;
      } catch (err) {
        errorCount += 1;
      }
    }
  }

  log(`Finalizado grupo. Sucesso=${successCount}; pulados=${skippedCount}; erros=${errorCount}`);
  if (errorCount > 0) {
    throw new Error(`Grupo sincronizado com ${errorCount} erros.`);
  }
}

export async function runSyncContasBancarias(options: SyncContasBancariasOptions, onLog?: (msg: string) => void): Promise<void> {
  const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  const { data: orgaos, error } = await supabase
    .from("tce_orgaos")
    .select("codigo_orgao,nome_orgao")
    .eq("codigo_municipio", options.municipio)
    .eq("exercicio_orcamento", options.exercicio)
    .order("codigo_orgao", { ascending: true });

  if (error) {
    throw error;
  }

  if (!orgaos?.length) {
    throw new Error(`Nenhum orgao encontrado para municipio=${options.municipio}, exercicio=${options.exercicio}.`);
  }

  const selectedOrgaos = options.maxOrgaos ? orgaos.slice(0, options.maxOrgaos) : orgaos;

  log(
    `Sincronizando contas bancarias por orgao: municipio=${options.municipio}; exercicio=${options.exercicio}; orgaos=${selectedOrgaos.length}`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const orgao of selectedOrgaos) {
    log(`Orgao ${orgao.codigo_orgao} - ${orgao.nome_orgao ?? ""}`);
    try {
      await runSyncTce({
        endpoint: "contasBancariasMunicipio",
        municipio: options.municipio,
        exercicio: options.exercicio,
        orgao: orgao.codigo_orgao,
        force: options.force
      }, onLog);
      successCount += 1;
    } catch (err) {
      errorCount += 1;
    }
  }

  const { count, error: countError } = await supabase
    .from("tce_contas_bancarias_municipio")
    .select("*", { count: "exact", head: true })
    .eq("codigo_municipio", options.municipio)
    .eq("exercicio_orcamento", options.exercicio);

  if (countError) {
    throw countError;
  }

  log(`Finalizado. Orgaos ok=${successCount}; erros=${errorCount}; total_normalizado=${count ?? 0}`);
  if (errorCount > 0) {
    throw new Error(`Contas bancarias sincronizadas com ${errorCount} erros.`);
  }
}

function validateRequiredParams(config: any, params: TceQueryParams) {
  const missing = config.requiredParams.filter((param: string) => params[param as keyof TceQueryParams] === undefined || params[param as keyof TceQueryParams] === "");

  if (missing.length > 0) {
    throw new Error(`Parametros obrigatorios ausentes para ${config.endpoint}: ${missing.join(", ")}`);
  }
}

function buildQueryParams(config: any, options: SyncOptions): TceQueryParams {
  const acceptedParams = new Set([...config.requiredParams, ...config.optionalParams]);
  const params: TceQueryParams = {};

  if (acceptedParams.has("codigo_municipio")) {
    params.codigo_municipio = options.municipio;
  }

  if (acceptedParams.has("exercicio_orcamento")) {
    params.exercicio_orcamento = options.exercicio;
  }

  if (acceptedParams.has("data_referencia_doc")) {
    params.data_referencia_doc = options.dataReferencia;
  }

  if (acceptedParams.has("codigo_orgao")) {
    params.codigo_orgao = options.orgao;
  }

  if (acceptedParams.has("codigo_unidade_orcamentaria")) {
    params.codigo_unidade_orcamentaria = options.unidadeOrcamentaria;
  }

  return params;
}

function stringOption(value: string | true | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberOption(value: string | true | undefined): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    throw new Error("Campo obrigatorio ausente na resposta da API");
  }

  return String(value);
}

function nullableText(value: unknown): string | null {
  return value === undefined || value === null || value === "" ? null : String(value);
}

function trimText(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    throw new Error("Campo obrigatorio ausente na resposta da API");
  }

  return String(value).trim();
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text.slice(0, 10) : null;
}

function dedupeByKey<T>(rows: T[], getKey: (row: T) => string): T[] {
  const byKey = new Map<string, T>();

  for (const row of rows) {
    byKey.set(getKey(row), row);
  }

  return Array.from(byKey.values());
}
