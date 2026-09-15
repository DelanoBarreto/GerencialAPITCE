import { logout } from "../../app/login/actions.js";

export function AccountBar({ email }: Readonly<{ email?: string }>) {
  return (
    <div className="account-bar">
      <span>{email ?? "Usuario autenticado"}</span>
      <form action={logout}><button type="submit">Sair</button></form>
    </div>
  );
}
