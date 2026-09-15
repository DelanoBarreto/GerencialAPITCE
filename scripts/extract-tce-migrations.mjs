import { readFileSync } from "node:fs";

const [historyPath, mode] = process.argv.slice(2);
if (!historyPath) throw new Error("Informe o caminho do historico JSONL do Claude.");

const versions = new Map([
  ["cria_schema_tce_e_registra_sistema", "20260915000925"],
  ["tce_tabelas_base", "20260915001343"],
  ["tce_tabelas_auxiliares_e_cadastros", "20260915001409"],
  ["tce_orcamentos_e_balancetes", "20260915001450"],
  ["tce_views_execucao_orcamentaria", "20260915001551"],
  ["tce_seed_endpoint_groups", "20260915002106"],
  ["tce_view_municipios_compat", "20260915002227"],
  ["tce_funcao_municipios_permitidos", "20260915002401"],
  ["tce_rls_politicas", "20260915002426"],
  ["tce_municipios_permitidos_sem_header", "20260915002847"],
  ["tce_grants_api", "20260915002953"]
]);

const found = new Map();
for (const line of readFileSync(historyPath, "utf8").split(/\r?\n/)) {
  if (!line) continue;
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  for (const item of entry.message?.content ?? []) {
    if (item.type !== "tool_use" || !item.name?.endsWith("apply_migration")) continue;
    const { name, project_id: projectId, query } = item.input ?? {};
    if (projectId !== "omcbfuiyaeakbsqbzgqk" || !versions.has(name)) continue;
    if (typeof query !== "string" || found.has(name)) throw new Error(`SQL ausente ou duplicado: ${name}`);
    found.set(name, query);
  }
}

if (found.size !== versions.size) {
  throw new Error(`Encontradas ${found.size} de ${versions.size} migrations TCE.`);
}

if (mode === "--verify") {
  for (const [name, version] of versions) {
    const expected = found.get(name).replace(/\r\n/g, "\n").replace(/\n+$/, "");
    const actual = readFileSync(`supabase/migrations/${version}_${name}.sql`, "utf8")
      .replace(/\r\n/g, "\n").replace(/\n+$/, "");
    if (actual !== expected) throw new Error(`Divergencia entre historico e arquivo: ${name}`);
  }
  process.stdout.write(`${versions.size} migrations TCE correspondem exatamente ao historico do Claude.\n`);
  process.exit(0);
}

if (mode) throw new Error(`Modo desconhecido: ${mode}`);

let patch = "*** Begin Patch\n";
for (const [name, version] of versions) {
  const query = found.get(name).replace(/\r\n/g, "\n").replace(/\n+$/, "");
  patch += `*** Add File: supabase/migrations/${version}_${name}.sql\n`;
  patch += `${query.split("\n").map((line) => `+${line}`).join("\n")}\n`;
}
patch += "*** End Patch\n";
process.stdout.write(patch);
