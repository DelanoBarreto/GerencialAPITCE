/** POST com cookie exige Origin canonico; falha fechado sem configuracao em producao. */
export function isAllowedRequestOrigin(
  request: Pick<Request, "url" | "headers">,
  configuredOrigin: string | undefined,
  production: boolean
): boolean {
  const origin = request.headers.get("origin");
  if (!origin || (production && !configuredOrigin?.trim())) return false;

  try {
    const expectedOrigin = configuredOrigin?.trim() || new URL(request.url).origin;
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}
