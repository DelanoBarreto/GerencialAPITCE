export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value;
}

/**
 * Chave exclusiva do servidor. Aceita a chave secreta atual e mantém o
 * service_role legado apenas como transição para instalações existentes.
 */
export function requiredSupabaseServerKey(): string {
  return process.env.SUPABASE_SECRET_KEY ?? requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function hasSupabaseServerConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}
