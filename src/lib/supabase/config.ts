export const TCE_SCHEMA = "tce" as const;

export function requireSupabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  );
}

export function requirePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY
  );
}

export function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim() &&
      (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.SUPABASE_ANON_KEY
      )?.trim()
  );
}

function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Variavel de ambiente ausente: ${name}.`);
  }
  return normalized;
}
