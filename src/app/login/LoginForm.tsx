"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions.js";

const initialState: LoginState = { error: null };

export function LoginForm({ redirectTo }: Readonly<{ redirectTo: string }>) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="redirect" value={redirectTo} />
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
