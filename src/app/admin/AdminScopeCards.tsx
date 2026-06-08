"use client";

import { Power, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

type MonthStatus = {
  competencia: string;
  label: string;
  status: string;
};

type ScopeCard = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
  sincronizacao_automatica: boolean;
  months: MonthStatus[];
};

type AdminScopeCardsProps = {
  scopes: ScopeCard[];
};

const filters = [
  { label: "Todos", value: "todos" },
  { label: "Aracati 2025", value: "aracati_2025" },
  { label: "Automaticos", value: "automaticos" },
  { label: "Com dados", value: "com_dados" },
  { label: "Pendentes", value: "pendentes" },
  { label: "Com erro", value: "erro" }
] as const;

const monthLabels: Record<string, string> = {
  disponivel: "Disponivel",
  pendente: "Pendente",
  erro: "Erro",
  nao_encerrado: "Nao encerrado"
};

export function AdminScopeCards({ scopes }: AdminScopeCardsProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("todos");

  const filteredScopes = useMemo(() => {
    const normalizedQuery = normalize(query);

    return scopes.filter((scope) => {
      const matchesQuery = normalize(`${scope.nome_municipio} ${scope.codigo_municipio} ${scope.ano}`).includes(normalizedQuery);
      const hasData = scope.months.some((month) => month.status === "disponivel");
      const hasPending = scope.months.some((month) => month.status === "pendente");
      const hasError = scope.months.some((month) => month.status === "erro");
      const matchesFilter =
        filter === "todos" ||
        (filter === "aracati_2025" && scope.codigo_municipio === "014" && scope.ano === 2025) ||
        (filter === "automaticos" && scope.sincronizacao_automatica) ||
        (filter === "com_dados" && hasData) ||
        (filter === "pendentes" && hasPending) ||
        (filter === "erro" && hasError);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, scopes]);

  return (
    <div className="admin-filtered-section">
      <div className="admin-filterbar flush">
        <label className="admin-filter-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar municipio, codigo ou ano..." />
        </label>
        <div className="admin-filter-chips" aria-label="Filtro de municipios">
          {filters.map((item) => (
            <button type="button" className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)} key={item.value}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-scope-cards">
        {filteredScopes.map((scope) => (
          <article className="admin-scope-card" key={`${scope.codigo_municipio}-${scope.exercicio_orcamento}`}>
            <div className="admin-scope-card-head">
              <div>
                <strong>{scope.nome_municipio}</strong>
                <span>
                  {scope.codigo_municipio} / {scope.ano} / {scope.exercicio_orcamento}
                </span>
              </div>
              <a className="admin-row-action admin-link-button" href={`/admin/municipios/${scope.codigo_municipio}/${scope.ano}`} title="Abrir painel do municipio">
                {scope.sincronizacao_automatica ? <RefreshCw size={17} /> : <Power size={17} />}
              </a>
            </div>
            <div className="admin-month-grid">
              {scope.months.map((month) => (
                <span className={`admin-month ${month.status}`} title={monthLabels[month.status] ?? month.status} key={month.competencia}>
                  {month.label}
                </span>
              ))}
            </div>
            <a className="admin-card-cta" href={`/admin/municipios/${scope.codigo_municipio}/${scope.ano}`}>
              Abrir painel do municipio
            </a>
          </article>
        ))}
      </div>

      {filteredScopes.length === 0 ? <div className="admin-empty">Nenhum municipio/ano encontrado para o filtro selecionado.</div> : null}
    </div>
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
