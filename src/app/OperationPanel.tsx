"use client";

import { CalendarRange, CheckCircle2, RefreshCw, ServerCog, TerminalSquare } from "lucide-react";
import { useMemo, useState } from "react";

type GrupoOption = {
  slug: string;
  nome: string;
};

type OperationPanelProps = {
  municipioCodigo: string;
  municipioNome: string;
  ano: number;
  grupos: GrupoOption[];
};

type OperationResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  output: string;
};

export function OperationPanel({ municipioCodigo, municipioNome, ano, grupos }: OperationPanelProps) {
  const [grupo, setGrupo] = useState("bal");
  const [runningAction, setRunningAction] = useState<"check" | "sync" | null>(null);
  const [result, setResult] = useState<OperationResult | null>(null);

  const orderedGroups = useMemo(() => {
    const knownOrder = ["auxiliares", "bas", "orc", "bal"];
    return [...grupos].sort((a, b) => knownOrder.indexOf(a.slug) - knownOrder.indexOf(b.slug));
  }, [grupos]);

  const selectedGroup = orderedGroups.find((option) => option.slug === grupo);
  const commandPreview = `npm run ${runningAction === "sync" ? "sync:grupo" : "check:grupo"} -- --municipio ${municipioCodigo} --grupo ${grupo} --exercicio ${ano}00 --data-inicial ${ano}01 --data-final ${ano}12 --default`;

  async function runOperation(action: "check" | "sync") {
    setRunningAction(action);
    setResult(null);

    try {
      const response = await fetch("/api/operacao/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          codigoMunicipio: municipioCodigo,
          ano,
          grupo
        })
      });

      const payload = (await response.json()) as OperationResult;
      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        command: "fetch /api/operacao/grupo",
        exitCode: 1,
        output: error instanceof Error ? error.message : "Erro desconhecido."
      });
    } finally {
      setRunningAction(null);
    }
  }

  const running = runningAction !== null;

  return (
    <>
      <div className="operation-heading">
        <div>
          <span className="eyebrow">Controle de carga</span>
          <h2>{selectedGroup?.nome ?? "Grupo TCE"}</h2>
        </div>
        <span className="operation-chip">
          <CheckCircle2 size={15} /> monitorado
        </span>
      </div>

      <div className="selector-row">
        <label>
          Municipio
          <select defaultValue={municipioCodigo} disabled={running}>
            <option value={municipioCodigo}>
              {municipioNome} - {municipioCodigo}
            </option>
          </select>
        </label>
        <label>
          Ano
          <select defaultValue={String(ano)} disabled={running}>
            <option value={String(ano)}>{ano}</option>
          </select>
        </label>
        <label>
          Grupo
          <select value={grupo} onChange={(event) => setGrupo(event.target.value)} disabled={running}>
            {orderedGroups.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="scope-note">
        O grupo sera verificado ou sincronizado para todas as competencias disponiveis do ano.
      </div>

      <div className="command-preview">
        <TerminalSquare size={17} />
        <span>{commandPreview}</span>
      </div>

      <div className="action-row">
        <button type="button" onClick={() => runOperation("check")} disabled={running}>
          <RefreshCw size={17} /> {runningAction === "check" ? "Verificando" : "Verificar"}
        </button>
        <button type="button" className="primary" onClick={() => runOperation("sync")} disabled={running}>
          <ServerCog size={17} /> {runningAction === "sync" ? "Sincronizando" : "Sincronizar grupo"}
        </button>
      </div>

      {running ? (
        <div className="operation-progress" role="status">
          <CalendarRange size={17} />
          <span>{runningAction === "sync" ? "Sincronizando dados da API do TCE..." : "Verificando competencias disponiveis..."}</span>
          <i />
        </div>
      ) : null}

      {result ? (
        <div className={result.ok ? "operation-result success" : "operation-result error"}>
          <div className="operation-result-header">
            <strong>{result.ok ? "Operacao concluida" : "Operacao com erro"}</strong>
            <span>exit {result.exitCode ?? "?"}</span>
          </div>
          <span>{result.command}</span>
          <pre>{result.output.slice(-5000)}</pre>
        </div>
      ) : null}
    </>
  );
}
