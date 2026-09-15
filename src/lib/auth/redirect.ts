/** Destinos permitidos apos login. Entrada vem de query/form e nao e confiavel. */
export function safeDestination(value: string): string {
  if (
    !/^\/(?:$|admin(?:\/|\?|$)|gestao(?:\/|\?|$)|apresentacao(?:\/|\?|$))/.test(value) ||
    value.startsWith("//") ||
    /[%\\\x00-\x1F]/.test(value)
  ) return "/";
  return value;
}
