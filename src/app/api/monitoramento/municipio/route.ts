import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
import { TceClient } from "../../../../lib/tce/client.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MonitorBody = {
  codigoMunicipio?: string;
  ano?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MonitorBody;
  const codigoMunicipio = String(body.codigoMunicipio ?? "");
  const ano = Number(body.ano);

  if (!/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, message: "Codigo do municipio invalido." }, { status: 400 });
  }

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    return Response.json({ ok: false, message: "Ano invalido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const exercicio = `${ano}00`;
  const now = new Date().toISOString();

  const { data: municipio, error: municipioError } = await supabase
    .from("municipios")
    .select("codigo_municipio")
    .eq("codigo_municipio", codigoMunicipio)
    .single();

  if (municipioError || !municipio) {
    let foundMunicipio = false;
    try {
      const tce = new TceClient();
      for await (const page of tce.paginate("municipios", { codigo_municipio: codigoMunicipio })) {
        if (page.rows.length > 0) {
          const row = page.rows[0];
          const { error: upsertError } = await supabase.from("municipios").upsert({
            codigo_municipio: String(row.codigo_municipio),
            nome_municipio: String(row.nome_municipio ?? row.descricao_municipio ?? row.nome),
            payload: row,
            updated_at: now
          }, { onConflict: "codigo_municipio" });
          
          if (!upsertError) {
            foundMunicipio = true;
          }
          break;
        }
      }
    } catch (err: any) {
      return Response.json({ ok: false, message: "Erro ao buscar municipio no TCE: " + err.message }, { status: 500 });
    }

    if (!foundMunicipio) {
      return Response.json({ ok: false, message: "Municipio nao encontrado localmente nem no TCE." }, { status: 404 });
    }
  }

  const { error: monitorError } = await supabase.from("tce_municipios_monitorados").upsert(
    {
      codigo_municipio: codigoMunicipio,
      ativo: true,
      sincronizacao_automatica: true,
      exercicio_orcamento_padrao: exercicio,
      observacoes: "Municipio cadastrado pela interface operacional",
      updated_at: now
    },
    { onConflict: "codigo_municipio" }
  );

  if (monitorError) {
    throw monitorError;
  }

  const { error: exercicioError } = await supabase.from("tce_municipio_exercicios_monitorados").upsert(
    {
      codigo_municipio: codigoMunicipio,
      exercicio_orcamento: exercicio,
      ano,
      ativo: true,
      sincronizacao_automatica: true,
      observacoes: "Exercicio cadastrado pela interface operacional",
      updated_at: now
    },
    { onConflict: "codigo_municipio,exercicio_orcamento" }
  );

  if (exercicioError) {
    throw exercicioError;
  }

  const { data: endpoints, error: endpointsError } = await supabase
    .from("tce_endpoint_catalog")
    .select("endpoint")
    .eq("habilitado_por_padrao", true);

  if (endpointsError) {
    throw endpointsError;
  }

  const subscriptions = (endpoints ?? []).map((item) => ({
    codigo_municipio: codigoMunicipio,
    exercicio_orcamento: exercicio,
    endpoint: item.endpoint,
    ativo: true,
    sincronizacao_automatica: true,
    updated_at: now
  }));

  if (subscriptions.length > 0) {
    const { error: subscriptionError } = await supabase
      .from("tce_sync_subscriptions")
      .upsert(subscriptions, { onConflict: "codigo_municipio,exercicio_orcamento,endpoint" });

    if (subscriptionError) {
      throw subscriptionError;
    }
  }

  return Response.json({
    ok: true,
    message: `Monitoramento cadastrado: municipio ${codigoMunicipio}, exercicio ${exercicio}.`
  });
}
