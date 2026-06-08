export function buildCompetencias(exercicio: string, options: {
  dataReferencia?: string;
  dataInicial?: string;
  dataFinal?: string;
}): string[] {
  if (options.dataReferencia) {
    return [normalizeCompetencia(options.dataReferencia, exercicio)];
  }

  const start = normalizeCompetencia(options.dataInicial ?? `${exercicio.slice(0, 4)}01`, exercicio);
  const end = normalizeCompetencia(options.dataFinal ?? `${exercicio.slice(0, 4)}12`, exercicio);

  return listCompetencias(start, end);
}

export function normalizeCompetencia(value: string, exercicio: string): string {
  if (/^\d{2}$/.test(value)) {
    return `${exercicio.slice(0, 4)}${value}`;
  }

  if (/^\d{6}$/.test(value)) {
    return value;
  }

  throw new Error(`Competencia invalida: ${value}. Use 01 ou 202501.`);
}

function listCompetencias(start: string, end: string): string[] {
  const startYear = Number(start.slice(0, 4));
  const endYear = Number(end.slice(0, 4));

  if (startYear !== endYear) {
    throw new Error("O intervalo de competencias deve estar dentro do mesmo ano.");
  }

  const startMonth = Number(start.slice(4, 6));
  const endMonth = Number(end.slice(4, 6));

  if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12 || startMonth > endMonth) {
    throw new Error(`Intervalo de competencias invalido: ${start} ate ${end}.`);
  }

  const result: string[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    result.push(`${startYear}${String(month).padStart(2, "0")}`);
  }

  return result;
}

