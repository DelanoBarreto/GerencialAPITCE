"use client";

import { CalendarRange, CheckCircle2, RefreshCw, ServerCog, TerminalSquare } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

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
  const [outputLines, setOutputLines] = useState<string[]>([]);

  const outputRef = useRef<HTMLPreElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const orderedGroups = useMemo(() => {
    const knownOrder = ["auxiliares", "bas", "orc", "bal"];
    return [...grupos].sort((a, b) => knownOrder.indexOf(a.slug) - knownOrder.indexOf(b.slug));
  }, [grupos]);

  const selectedGroup = orderedGroups.find((option) => option.slug === grupo);
  const commandPreview = `npm run ${runningAction === "sync" ? "sync:grupo" : "check:grupo"} -- --municipio ${municipioCodigo} --grupo ${grupo} --exercicio ${ano}00 --data-inicial ${ano}01 --data-final ${ano}12 --default`;

  useEffect(() => {
    // Auto-scroll para o final da saída quando houver novas linhas
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  async function runOperation(action: "check" | "sync") {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setRunningAction(action);
    setResult(null);
    setOutputLines([]);

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

      // Lidar com o stream SSE manualmente lendo o body
      if (!response.body) {
        throw new Error("No response body");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let finalCommand = commandPreview;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Processar os eventos SSE
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const eventStr = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          
          let eventType = "message";
          let dataStr = "";

          for (const line of eventStr.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) dataStr += line.slice(6);
          }

          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "start") {
                finalCommand = data.command;
              } else if (eventType === "line") {
                setOutputLines((prev) => {
                  const newLines = [...prev, data.text];
                  // Manter apenas as últimas 500 linhas para não pesar
                  if (newLines.length > 500) return newLines.slice(newLines.length - 500);
                  return newLines;
                });
              } else if (eventType === "done") {
                setResult({
                  ok: data.ok,
                  command: finalCommand,
                  exitCode: data.exitCode,
                  output: ""
                });
                setRunningAction(null);
                return; // Fim do stream
              } else if (eventType === "error") {
                 setResult({
                  ok: false,
                  command: finalCommand,
                  exitCode: 1,
                  output: data.message
                });
                setRunningAction(null);
                return;
              }
            } catch (err) {
              console.error("Erro no parse JSON do SSE", err);
            }
          }
          
          boundary = buffer.indexOf("\n\n");
        }
      }

    } catch (error) {
      setResult({
        ok: false,
        command: "fetch /api/operacao/grupo",
        exitCode: 1,
        output: error instanceof Error ? error.message : "Erro desconhecido."
      });
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
          <i className="spinner" />
        </div>
      ) : null}

      {(running && outputLines.length > 0) || result ? (
        <div className={result ? (result.ok ? "operation-result success" : "operation-result error") : "operation-result running"}>
          <div className="operation-result-header">
            <strong>{result ? (result.ok ? "Operacao concluida" : "Operacao com erro") : "Progresso da operacao"}</strong>
            {result && <span>exit {result.exitCode ?? "?"}</span>}
          </div>
          <span>{result ? result.command : commandPreview}</span>
          <pre ref={outputRef} style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {outputLines.join("\n")}
            {result?.output && "\n" + result.output}
          </pre>
        </div>
      ) : null}
    </>
  );
}
