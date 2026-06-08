"use client";

import { MoreVertical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminScopeRow } from "./admin-data.js";

type AdminScopeStatusTableProps = {
  rows: AdminScopeRow[];
};

const statusFilters = [
  { label: "Todos", value: "todos" },
  { label: "Sucesso", value: "ok" },
  { label: "Parcial", value: "parcial" },
  { label: "Pendente", value: "pendente" },
  { label: "Erro", value: "erro" }
] as const;

export function AdminScopeStatusTable({ rows }: AdminScopeStatusTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]["value"]>("todos");

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalize(query);

    return rows.filter((row) => {
      const matchesQuery = normalize(`${row.municipio} ${row.codigo} ${row.ano}`).includes(normalizedQuery);
      const matchesStatus = status === "todos" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  return (
    <>
      <div className="admin-table-toolbar">
        <label className="admin-filter-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar município, código ou ano..." />
        </label>
        <div className="admin-filter-chips" aria-label="Filtro de status">
          {statusFilters.map((item) => (
            <button type="button" className={status === item.value ? "active" : ""} onClick={() => setStatus(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table">
        <div className="admin-table-head admin-scope-grid">
          <span>Município / ano</span>
          <span>Último mês</span>
          <span>Última atualização</span>
          <span>Registros</span>
          <span>Clientes</span>
          <span>Status</span>
          <span>Ações</span>
        </div>
        {filteredRows.map((row) => (
          <div className={`admin-table-row admin-scope-grid ${row.status === "erro" ? "danger" : ""}`} key={`${row.codigo}-${row.exercicio}`}>
            <div>
              <strong>{row.municipio}</strong>
              <small>
                {row.codigo} / {row.ano} / {row.automatico ? "auto" : "manual"}
              </small>
            </div>
            <span>{row.ultimoMes}</span>
            <span>{row.ultimaSync}</span>
            <span>{formatInt(row.registros)}</span>
            <span>{row.clientes}</span>
            <StatusBadge status={row.status} />
            <a className="admin-row-action admin-link-button" href={`/admin/municipios/${row.codigo}/${row.ano}`} title="Abrir painel do município">
              <MoreVertical size={18} />
            </a>
          </div>
        ))}
      </div>

      {filteredRows.length === 0 ? <div className="admin-empty">Nenhum município encontrado para o filtro selecionado.</div> : null}
    </>
  );
}

function StatusBadge({ status }: Readonly<{ status: AdminScopeRow["status"] }>) {
  const labels = {
    ok: "Sucesso",
    parcial: "Parcial",
    erro: "Erro",
    pendente: "Pendente"
  };

  return <b className={`admin-status ${status}`}>{labels[status]}</b>;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}
