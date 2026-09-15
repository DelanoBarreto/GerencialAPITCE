import { ApresentacaoView } from "../../aracati/page.js";

type PageProps = { params: Promise<{ codigo: string; exercicio: string }> };

export default async function ApresentacaoMunicipioPage({ params }: PageProps) {
  const { codigo, exercicio } = await params;
  return <ApresentacaoView codigo={codigo} exercicio={exercicio} />;
}
