/** Funcoes puras compartilhadas com componentes de navegador. */
export function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function relativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));

  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `ha ${hours} h`;
  return `ha ${Math.round(hours / 24)} dias`;
}
