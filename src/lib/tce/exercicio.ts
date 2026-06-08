export function normalizeExercicio(value: string): string {
  if (/^\d{4}$/.test(value)) {
    return `${value}00`;
  }

  if (/^\d{6}$/.test(value)) {
    return value;
  }

  throw new Error(`Exercicio invalido: ${value}. Use 2025 ou 202500.`);
}

export function parseExercicioFromArgs(
  values: Map<string, string | true>,
  fallback?: string
): string {
  const raw = stringOption(values.get("exercicio")) ?? stringOption(values.get("ano")) ?? fallback;

  if (!raw) {
    throw new Error("Informe --ano, --exercicio ou configure TCE_DEFAULT_EXERCICIO.");
  }

  return normalizeExercicio(raw);
}

export function parseExerciciosFromArgs(
  values: Map<string, string | true>,
  fallback?: string
): string[] {
  const raw =
    stringOption(values.get("exercicios")) ??
    stringOption(values.get("anos")) ??
    stringOption(values.get("exercicio")) ??
    stringOption(values.get("ano")) ??
    fallback;

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeExercicio);
}

function stringOption(value: string | true | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

