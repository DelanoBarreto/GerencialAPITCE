import { LoginForm } from "./LoginForm.js";

type LoginPageProps = { searchParams: Promise<{ redirect?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect = "/" } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">AP</div>
        <span>APITCE Gerencial</span>
        <h1 id="login-title">Acesso restrito</h1>
        <p>Use a mesma conta autorizada na plataforma PortalGov.</p>
        <LoginForm redirectTo={redirect} />
      </section>
    </main>
  );
}
