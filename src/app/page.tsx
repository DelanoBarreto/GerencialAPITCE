import { redirect } from "next/navigation.js";
import { requireTcePage } from "../lib/auth/access.js";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const access = await requireTcePage("/");

  if (access.role === "superadmin") redirect("/admin");

  const municipio = access.municipios[0];
  if (!municipio) redirect("/acesso-negado");

  const exercicio = process.env.TCE_DEFAULT_EXERCICIO?.trim() || "202500";
  redirect(`/gestao/${municipio.codigo_municipio}/${exercicio}`);
}
