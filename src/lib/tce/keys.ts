import { createHash } from "node:crypto";

const PREFERRED_KEY_FIELDS = [
  "codigo_municipio",
  "exercicio_orcamento",
  "data_referencia_doc",
  "codigo_orgao",
  "codigo_unidade_orcamentaria",
  "codigo_rubrica",
  "codigo_fonte",
  "tipo_fonte",
  "numero_empenho",
  "numero_liquidacao",
  "numero_pagamento",
  "codigo_fornecedor"
];

export function createNaturalKey(record: Record<string, unknown>, fallbackIndex: number): string {
  const parts = PREFERRED_KEY_FIELDS
    .filter((field) => record[field] !== undefined && record[field] !== null && record[field] !== "")
    .map((field) => `${field}:${String(record[field])}`);

  if (parts.length > 0) {
    return `${parts.join("|")}|hash:${hashRecord(record)}`;
  }

  return `row:${fallbackIndex}|hash:${hashRecord(record)}`;
}

function hashRecord(record: Record<string, unknown>): string {
  return createHash("sha256").update(stableStringify(record)).digest("hex").slice(0, 24);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}
