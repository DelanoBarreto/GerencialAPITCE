"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminGroupCardRow } from "./AdminGroupCards.js";

type AdminGroupStatusTableProps = {
  rows: AdminGroupCardRow[];
};

const filters = [
  { label: "Todos", value: "todos" },
  { label: "Com dados", value: "ok" },
  { label: "Com erro", value: "erro" },
  { label: "Sem log", value: "sem_log" },
  { label: "Sem endpoints", value: "vazio" }
] as const;

export function AdminGroupStatusTable({ rows }: AdminGroupStatusTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("todos");

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalize(query);

    return rows.filter((row) => {
      const matchesQuery = normalize(`${row.slug} ${row.nome}`).includes(normalizedQuery);
      const matchesFilter =
        filter === "todos" ||
        (filter === "ok" && row.ultimoStatus === "ok") ||
        (filter === "erro" && row.errors > 0) ||
        (filter === "sem_log" && row.ultimoStatus === "sem_log") ||
        (filter === "vazio" && row.endpoints === 0);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rows]);

  return (
    <>
      <div className="admin-table-toolbar">
        <label className="admin-filter-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar grupo ou base..." />
        </label>
        <div className="admin-filter-chips" aria-label="Filtro da tabela de grupos">
          {filters.map((item) => (
            <button type="button" className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table">
        <div className="admin-table-head admin-group-grid">
          <span>Grupo</span>
          <span>Endpoints</span>
          <span>Automaticos</span>
          <span>Ultima atualizacao</span>
          <span>Registros</span>
          <span>Erros</span>
          <span>Status</span>
        </div>
        {filteredRows.map((row) => (
          <div className={`admin-table-row admin-group-grid ${row.errors > 0 ? "danger" : ""}`} key={row.slug}>
            <div>
              <strong>{row.nome}</strong>
              <small>{row.slug.toUpperCase()}</small>
            </div>
            <span>{formatInt(row.endpoints)}</span>
            <span>{formatInt(row.automaticos)}</span>
            <span>{row.ultimaSync}</span>
            <span>{formatInt(row.registros)}</span>
            <span>{formatInt(row.errors)}</span>
            <b className={`admin-status ${row.ultimoStatus === "ok" ? "ok" : row.ultimoStatus === "error" ? "erro" : "pendente"}`}>
              {row.ultimoStatus === "sem_log" ? "sem log" : row.ultimoStatus}
            </b>
          </div>
        ))}
      </div>

      {filteredRows.length === 0 ? <div className="admin-empty">Nenhum grupo encontrado para o filtro selecionado.</div> : null}
    </>
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}
