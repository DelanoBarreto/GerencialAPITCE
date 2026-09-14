import type { PeriodoInfo } from "./periodo.js";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatCompetencia(value: string) {
  if (!/^\d{6}$/.test(value)) return value;
  const month = Number(value.slice(4));
  const label = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][month - 1];
  if (!label) return value;
  return `${label}/${value.slice(0, 4)}`;
}

export function formatPeriodoCompetencias(inicio: string | undefined, fim: string | undefined) {
  if (!inicio && !fim) return "período não informado";
  if (inicio && fim) return `${formatCompetencia(inicio)} a ${formatCompetencia(fim)}`;
  return inicio ? `desde ${formatCompetencia(inicio)}` : `até ${formatCompetencia(fim ?? "")}`;
}

export function formatPeriodoInfo(periodo: PeriodoInfo) {
  if (!periodo.inicio || !periodo.fim) return "período não informado";
  if (periodo.inicio === periodo.fim) return formatCompetencia(periodo.inicio);
  return `${formatCompetencia(periodo.inicio)} — ${formatCompetencia(periodo.fim)}`;
}
