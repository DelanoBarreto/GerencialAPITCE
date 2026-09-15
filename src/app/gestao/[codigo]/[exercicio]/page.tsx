import { GestaoView } from "../../page.js";

type PageProps = { params: Promise<{ codigo: string; exercicio: string }> };

export default async function GestaoMunicipioPage({ params }: PageProps) {
  const { codigo, exercicio } = await params;
  return <GestaoView codigo={codigo} exercicio={exercicio} />;
}
