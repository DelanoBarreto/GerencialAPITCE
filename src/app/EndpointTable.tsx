"use client";

import { RefreshCw, ServerCog } from "lucide-react";
import { useState } from "react";

type EndpointRow = {
  endpoint: string;
  grupo: string;
  descricao: string;
  frequencia: string;
  frequenciaLabel: string;
  ultimo_status: string;
  statusLabel: string;
  linhasLabel: string;
};

type EndpointTableProps = {
  codigoMunicipio: string;
  ano: number;
  endpoints: EndpointRow[];
};

type EndpointResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  output: string;
};

export function EndpointTable({ codigoMunicipio, ano, endpoints }: EndpointTableProps) {
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [result, setResult] = useState<EndpointResult | null>(null);

  async function runEndpoint(action: "check" | "sync", endpoint: string) {
    const key = `${action}:${endpoint}`;
    setRunningKey(key);
    setResult(null);

    try {
      const response = await fetch("/api/operacao/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          codigoMunicipio,
          ano,
          endpoint
        })
      });

      const payload = (await response.json()) as EndpointResult;
      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        command: "fetch /api/operacao/endpoint",
        exitCode: 1,
        output: error instanceof Error ? error.message : "Erro desconhecido."
      });
    } finally {
      setRunningKey(null);
    }
  }

  return (
    <>
      <div className="endpoint-head">
        <span>Endpoint</span>
        <span>Grupo</span>
        <span>Freq.</span>
        <span>Status</span>
        <span>Linhas</span>
        <span>Acoes</span>
      </div>
      {endpoints.map((item) => (
        <div className="endpoint-row" key={item.endpoint}>
          <div>
            <strong>{item.descricao}</strong>
            <span>{item.endpoint}</span>
          </div>
          <em>{item.grupo}</em>
          <small>{item.frequenciaLabel}</small>
          <b className={item.ultimo_status === "ok" ? "ok" : item.ultimo_status === "error" ? "error" : "idle"}>
            {item.statusLabel}
          </b>
          <i>{item.linhasLabel}</i>
          <div className="endpoint-actions">
            <button
              type="button"
              onClick={() => runEndpoint("check", item.endpoint)}
              disabled={runningKey !== null}
              title="Verificar endpoint"
            >
              <RefreshCw size={15} />
              {runningKey === `check:${item.endpoint}` ? "..." : "Verificar"}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => runEndpoint("sync", item.endpoint)}
              disabled={runningKey !== null}
              title="Sincronizar endpoint"
            >
              <ServerCog size={15} />
              {runningKey === `sync:${item.endpoint}` ? "..." : "Sync"}
            </button>
          </div>
        </div>
      ))}

      {result ? (
        <div className={result.ok ? "operation-result success" : "operation-result error"}>
          <div className="operation-result-header">
            <strong>{result.ok ? "Endpoint concluido" : "Endpoint com erro"}</strong>
            <span>exit {result.exitCode ?? "?"}</span>
          </div>
          <span>{result.command}</span>
          <pre>{result.output.slice(-5000)}</pre>
        </div>
      ) : null}
    </>
  );
}
