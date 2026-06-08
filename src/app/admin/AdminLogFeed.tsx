"use client";

import { Clock3, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminSyncLog } from "./admin-data.js";
import { formatInt, relativeTime } from "./admin-data.js";

type AdminLogFeedProps = {
  logs: AdminSyncLog[];
};

const statusFilters = [
  { label: "Todos", value: "todos" },
  { label: "Ok", value: "ok" },
  { label: "Erro", value: "error" },
  { label: "Pendente", value: "pendente" }
] as const;

export function AdminLogFeed({ logs }: AdminLogFeedProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]["value"]>("todos");

  const filteredLogs = useMemo(() => {
    const normalizedQuery = normalize(query);

    return logs.filter((log) => {
      const matchesQuery = normalize(`${log.endpoint} ${log.codigo_municipio ?? ""} ${log.data_referencia_doc ?? ""}`).includes(normalizedQuery);
      const matchesStatus = status === "todos" || log.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [logs, query, status]);

  const recent = filteredLogs.slice(0, 18);

  return (
    <div className="admin-log-feed">
      <div className="admin-log-toolbar">
        <label className="admin-filter-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar endpoint, municipio ou competencia..." />
        </label>
        <div className="admin-filter-chips" aria-label="Filtro de logs">
          {statusFilters.map((item) => (
            <button type="button" className={status === item.value ? "active" : ""} onClick={() => setStatus(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
        <span className="admin-log-count">
          <Clock3 size={14} />
          {formatInt(recent.length)} de {formatInt(logs.length)}
        </span>
      </div>

      <div className="admin-log-list">
        {recent.map((log, index) => (
          <article className={`admin-log-card ${log.status}`} key={`${log.endpoint}-${log.started_at}-${index}`}>
            <div className="admin-log-card-head">
              <div>
                <strong>{log.endpoint}</strong>
                <span>
                  {log.codigo_municipio ?? "global"}
                  {log.data_referencia_doc ? ` · ${log.data_referencia_doc}` : ""}
                </span>
              </div>
              <b className={`admin-status ${log.status === "ok" ? "ok" : log.status === "error" ? "erro" : "pendente"}`}>{log.status}</b>
            </div>
            <div className="admin-log-card-body">
              <span>{formatInt(log.rows_received ?? 0)} linhas</span>
              <span>{relativeTime(log.started_at)}</span>
            </div>
            <p>{log.error_message ?? "sem mensagem de erro"}</p>
          </article>
        ))}
        {recent.length === 0 ? <div className="admin-empty">Nenhum log encontrado para o filtro atual.</div> : null}
      </div>
    </div>
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
