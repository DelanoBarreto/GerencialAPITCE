"use server";

import { redirect } from "next/navigation.js";
import { createSupabaseServerClient } from "../../lib/supabase/server.js";
import { safeDestination } from "../../lib/auth/redirect.js";

export type LoginState = { error: string | null };

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const destination = safeDestination(String(formData.get("redirect") ?? "/"));

  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha invalidos." };

  redirect(destination);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
