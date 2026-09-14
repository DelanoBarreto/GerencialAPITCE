export type PeriodoInfo = {
  inicio: string | null;
  fim: string | null;
  total: number;
  faltantes: string[];
  continuo: boolean;
};

export function describePeriodo(competencias: string[]): PeriodoInfo {
  const validas = [...new Set(competencias.filter((c) => /^\d{6}$/.test(c)))].sort();

  if (!validas.length) {
    return { inicio: null, fim: null, total: 0, faltantes: [], continuo: true };
  }

  const inicio = validas[0]!;
  const fim = validas[validas.length - 1]!;
  const presentes = new Set(validas);
  const faltantes: string[] = [];

  for (let cursor = inicio; cursor <= fim; cursor = proximaCompetencia(cursor)) {
    if (!presentes.has(cursor)) faltantes.push(cursor);
  }

  return { inicio, fim, total: validas.length, faltantes, continuo: faltantes.length === 0 };
}

function proximaCompetencia(competencia: string) {
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(4));
  if (mes >= 12) return `${ano + 1}01`;
  return `${ano}${String(mes + 1).padStart(2, "0")}`;
}
