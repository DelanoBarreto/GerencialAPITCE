import { logout } from "../login/actions.js";

export default function AccessDeniedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="access-title">
        <div className="auth-brand">AP</div>
        <span>APITCE Gerencial</span>
        <h1 id="access-title">Acesso nao liberado</h1>
        <p>Sua conta esta autenticada, mas ainda nao possui vinculo ativo com o sistema TCE.</p>
        <form action={logout}><button type="submit">Sair</button></form>
      </section>
    </main>
  );
}
