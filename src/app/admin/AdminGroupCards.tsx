"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export type AdminGroupCardRow = {
  slug: string;
  nome: string;
  endpoints: number;
  automaticos: number;
  ultimoStatus: string;
  ultimaSync: string;
  registros: number;
  errors: number;
};

type AdminGroupCardsProps = {
  rows: AdminGroupCardRow[];
};

const filters = [
  { label: "Monitorados", value: "monitorados" },
  { label: "Com dados", value: "ok" },
  { label: "Com erro", value: "erro" },
  { label: "Sem log", value: "sem_log" },
  { label: "Sem endpoints", value: "vazio" },
  { label: "Todos", value: "todos" }
] as const;

export function AdminGroupCards({ rows }: AdminGroupCardsProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("monitorados");

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalize(query);

    return rows.filter((row) => {
      const matchesQuery = normalize(`${row.slug} ${row.nome}`).includes(normalizedQuery);
      const matchesFilter =
        filter === "todos" ||
        (filter === "monitorados" && row.endpoints > 0) ||
        (filter === "ok" && row.ultimoStatus === "ok") ||
        (filter === "erro" && row.errors > 0) ||
        (filter === "sem_log" && row.ultimoStatus === "sem_log") ||
        (filter === "vazio" && row.endpoints === 0);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rows]);

  return (
    <div className="admin-filtered-section">
      <div className="admin-filterbar">
        <label className="admin-filter-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar grupos..." />
        </label>
        <div className="admin-filter-chips" aria-label="Filtro de grupos">
          {filters.map((item) => (
            <button type="button" className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-group-card-grid compact">
        {filteredRows.map((row) => (
          <article className={`admin-group-card ${row.errors > 0 ? "attention" : row.ultimoStatus === "ok" ? "ready" : ""}`} key={row.slug}>
            <div>
              <strong title={row.slug}>{formatSlug(row.slug)}</strong>
              <b className={`admin-status ${row.ultimoStatus === "ok" ? "ok" : row.ultimoStatus === "error" ? "erro" : "pendente"}`}>
                {row.ultimoStatus === "sem_log" ? "sem log" : row.ultimoStatus}
              </b>
            </div>
            <h3 title={row.nome}>{row.nome}</h3>
            <p>
              {formatInt(row.endpoints)} endpoints · {formatInt(row.automaticos)} automáticos
            </p>
            <span>{row.ultimaSync}</span>
          </article>
        ))}
      </div>

      {filteredRows.length === 0 ? <div className="admin-empty">Nenhum grupo encontrado para o filtro selecionado.</div> : null}
    </div>
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function formatSlug(value: string): string {
  if (value.length <= 18) {
    return value.toUpperCase();
  }

  return `${value.slice(0, 15).toUpperCase()}...`;
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}
