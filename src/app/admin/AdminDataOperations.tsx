"use client";

import { DatabaseZap, FileClock, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

type ScopeOption = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
};

type GroupOption = {
  slug: string;
  nome: string;
};

type OperationResult = {
  ok: boolean;
  command?: string;
  exitCode?: number | null;
  output?: string;
  error?: string;
};

type AdminDataOperationsProps = {
  scopes: ScopeOption[];
  groups: GroupOption[];
  testHint?: string;
};

export function AdminDataOperations({ scopes, groups, testHint = "Aracati 2025 + BAS" }: AdminDataOperationsProps) {
  const [scopeKey, setScopeKey] = useState(() => {
    const aracati2025 = scopes.find((scope) => scope.codigo_municipio === "014" && scope.ano === 2025);
    const first = aracati2025 ?? scopes[0];
    return first ? `${first.codigo_municipio}:${first.ano}` : "";
  });
  const [groupSlug, setGroupSlug] = useState(() => groups.find((group) => group.slug === "bas")?.slug ?? groups[0]?.slug ?? "");
  const [running, setRunning] = useState<"check" | "sync" | "force" | null>(null);
  const [result, setResult] = useState<OperationResult | null>(null);

  const selectedScope = useMemo(
    () => scopes.find((scope) => `${scope.codigo_municipio}:${scope.ano}` === scopeKey) ?? scopes[0],
    [scopeKey, scopes]
  );
  const selectedGroup = groups.find((group) => group.slug === groupSlug);

  async function runOperation(action: "check" | "sync" | "force") {
    if (!selectedScope || !selectedGroup) {
      setResult({ ok: false, error: "Selecione um município/ano e um grupo antes de executar." });
      return;
    }

    setRunning(action);
    setResult(null);

    try {
      const response = await fetch("/api/operacao/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "check" ? "check" : "sync",
          codigoMunicipio: selectedScope.codigo_municipio,
          ano: selectedScope.ano,
          grupo: selectedGroup.slug,
          force: action === "force"
        })
      });
      const payload = (await response.json()) as OperationResult;
      setResult(payload);

      if (payload.ok) {
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido."
      });
    } finally {
      setRunning(null);
    }
  }

  const disabled = running !== null || !selectedScope || !selectedGroup;

  return (
    <section className="admin-panel admin-operation-panel" id="atualizar-dados">
      <div className="admin-panel-title compact">
        <div>
          <span>Atualização de dados</span>
          <h2>Rodar carga por município, ano e grupo</h2>
        </div>
        <DatabaseZap size={21} />
      </div>

      <div className="admin-operation-body">
        <div className="admin-operation-selectors">
          <label>
            Município / ano
            <select value={scopeKey} onChange={(event) => setScopeKey(event.target.value)} disabled={disabled}>
              {scopes.map((scope) => (
                <option value={`${scope.codigo_municipio}:${scope.ano}`} key={`${scope.codigo_municipio}-${scope.ano}`}>
                  {scope.nome_municipio} - {scope.ano}
                </option>
              ))}
            </select>
          </label>
          <label>
            Grupo de dados
            <select value={groupSlug} onChange={(event) => setGroupSlug(event.target.value)} disabled={disabled}>
              {groups.map((group) => (
                <option value={group.slug} key={group.slug}>
                  {group.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-operation-help">
          <strong>Fluxo recomendado</strong>
          <span>1. Cadastre o municipio/ano em Municipios. 2. Volte aqui para verificar. 3. Clique em Baixar/atualizar dados. 4. Confira o resultado em Logs. Para teste use {testHint}.</span>
        </div>

        <div className="admin-operation-actions">
          <button type="button" className="admin-dark-button" onClick={() => runOperation("check")} disabled={disabled}>
            <Search size={17} />
            {running === "check" ? "Verificando..." : "Verificar atualizações"}
          </button>
          <button type="button" className="admin-sync-button" onClick={() => runOperation("sync")} disabled={disabled}>
            <DatabaseZap size={17} />
            {running === "sync" ? "Baixando..." : "Baixar/atualizar dados"}
          </button>
          <button type="button" className="admin-dark-button" onClick={() => runOperation("force")} disabled={disabled}>
            <RotateCcw size={17} />
            {running === "force" ? "Reprocessando..." : "Forçar reprocessamento"}
          </button>
          <a className="admin-dark-button admin-link-button" href="/admin/municipios">
            <Plus size={17} />
            Cadastrar município/ano
          </a>
          <a className="admin-dark-button admin-link-button" href="/admin/logs">
            <FileClock size={17} />
            Ver logs
          </a>
        </div>

        {running ? (
          <div className="admin-operation-running">
            <RefreshCw size={17} />
            Executando rotina. Aguarde a conclusão antes de iniciar outra ação.
          </div>
        ) : null}

        {result ? (
          <div className={result.ok ? "admin-operation-result success" : "admin-operation-result error"}>
            <strong>{result.ok ? "Operação concluída" : "Operação não concluída"}</strong>
            <span>{result.command ?? result.error ?? "Sem comando retornado."}</span>
            {result.output ? <pre>{result.output.slice(-4000)}</pre> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
