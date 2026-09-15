import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
import { authorizeInternalOperation } from "../../../../lib/auth/operation.js";
import { acquireOperationLock } from "../../../../lib/ops/operation-lock.js";
import { runNpmScript, type NpmScriptResult } from "../../../../lib/ops/run-npm-script.js";
import { runSyncTce, runSyncContasBancarias } from "../../../../lib/tce/sync-runner.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedActions = new Set(["check", "sync"]);

type EndpointOperationBody = {
  action?: string;
  codigoMunicipio?: string;
  ano?: number;
  endpoint?: string;
};

type CatalogRow = {
  endpoint: string;
  frequencia_sugerida: string;
};

export async function POST(request: Request) {
  const authorization = await authorizeInternalOperation(request);
  if (!authorization.ok) return authorization.response;

  let body: EndpointOperationBody;
  try {
    body = (await request.json()) as EndpointOperationBody;
  } catch {
    return Response.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false, error: "Parametros invalidos." }, { status: 400 });
  }
  const { action, codigoMunicipio, ano, endpoint } = body;

  if (typeof action !== "string" || !allowedActions.has(action)) {
    return Response.json({ ok: false, error: "Acao invalida." }, { status: 400 });
  }

  if (typeof codigoMunicipio !== "string" || !/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, error: "Municipio invalido." }, { status: 400 });
  }

  if (typeof ano !== "number" || !Number.isInteger(ano) || ano < 2000 || ano > 2099) {
    return Response.json({ ok: false, error: "Ano invalido." }, { status: 400 });
  }

  if (typeof endpoint !== "string" || !/^[a-z0-9_]+$/.test(endpoint)) {
    return Response.json({ ok: false, error: "Endpoint invalido." }, { status: 400 });
  }

  const exercicio = `${ano}00`;
  const supabase = createSupabaseAdminClient();
  const [{ data: catalog, error: catalogError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    supabase.from("tce_endpoint_catalog").select("endpoint,frequencia_sugerida").eq("endpoint", endpoint).single(),
    supabase
      .from("tce_sync_subscriptions")
      .select("endpoint")
      .eq("codigo_municipio", codigoMunicipio)
      .eq("exercicio_orcamento", exercicio)
      .eq("endpoint", endpoint)
      .eq("ativo", true)
      .single()
  ]);

  if (catalogError || !catalog) {
    return Response.json({ ok: false, error: "Endpoint nao encontrado no catalogo." }, { status: 404 });
  }

  if (subscriptionError || !subscription) {
    return Response.json({ ok: false, error: "Endpoint nao monitorado para este municipio/ano." }, { status: 404 });
  }

  const release = await acquireOperationLock({
    key: `endpoint:${codigoMunicipio}:${exercicio}:${endpoint}`,
    userId: authorization.user.id,
    action,
    codigoMunicipio,
    exercicio,
    target: endpoint
  });
  if (!release) {
    return Response.json({ ok: false, error: "Esta operacao ja esta em andamento." }, { status: 409 });
  }

  try {
    const result = await runEndpointOperation(action as "check" | "sync", codigoMunicipio, exercicio, ano, catalog as CatalogRow);
    const ok = result.exitCode === 0;
    await release(ok ? "ok" : "erro", ok ? undefined : "execucao nao concluida");

    return Response.json({
      ok,
      exitCode: result.exitCode,
      output: ok ? "Operacao concluida. Consulte a auditoria." : "Operacao nao concluida. Consulte a auditoria."
    });
  } catch (error) {
    await release("erro", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ ok: false, error: "Falha interna ao executar a operacao." }, { status: 500 });
  }
}

async function runEndpointOperation(
  action: "check" | "sync",
  codigoMunicipio: string,
  exercicio: string,
  ano: number,
  catalog: CatalogRow
): Promise<NpmScriptResult & { command: string }> {
  if (action === "sync") {
    const outputs: string[] = [];
    const onLog = (msg: string) => outputs.push(msg);
    let finalExitCode: number | null = 0;
    const commands: string[] = [];

    if (catalog.endpoint === "contas_bancarias_municipio") {
      try {
        await runSyncContasBancarias({ municipio: codigoMunicipio, exercicio, force: true }, onLog);
        commands.push("runSyncContasBancarias");
      } catch (err: any) {
        outputs.push("Error: " + err.message);
        finalExitCode = 1;
      }
      return { exitCode: finalExitCode, command: commands.join("\n"), output: outputs.join("\n") };
    }

    const competencias = catalog.frequencia_sugerida === "mensal" ? buildCompetencias(ano) : [undefined];
    for (const competencia of competencias) {
      try {
        await runSyncTce({
          endpoint: catalog.endpoint,
          municipio: codigoMunicipio,
          exercicio: exercicio,
          dataReferencia: competencia,
          force: true
        }, onLog);
        commands.push(`runSyncTce(${competencia ?? "anual"})`);
      } catch (err: any) {
        outputs.push("Error: " + err.message);
        finalExitCode = 1;
        break;
      }
    }
    return { exitCode: finalExitCode, command: commands.join("\n"), output: outputs.join("\n") };
  }

  const competencias = catalog.frequencia_sugerida === "mensal" ? buildCompetencias(ano) : [undefined];
  const outputs: string[] = [];
  let finalExitCode: number | null = 0;
  const script = "check:updates";
  const commands: string[] = [];

  for (const competencia of competencias) {
    const args = buildArgs(action, codigoMunicipio, exercicio, catalog.endpoint, competencia);
    const result = await runNpmScript(script, args);

    commands.push(`npm run ${script} -- ${args.join(" ")}`);
    outputs.push(result.output);

    if (result.exitCode !== 0) {
      finalExitCode = result.exitCode;
      break;
    }
  }

  return {
    exitCode: finalExitCode,
    command: commands.join("\n"),
    output: outputs.join("\n")
  };
}

function buildArgs(action: "check" | "sync", codigoMunicipio: string, exercicio: string, endpoint: string, competencia?: string) {
  const args = ["--municipio", codigoMunicipio, "--endpoint", endpoint, "--exercicio", exercicio];

  if (competencia) {
    args.push("--data-referencia", competencia);
  }

  if (action === "sync") {
    args.push("--force");
  }

  return args;
}

function buildCompetencias(ano: number): string[] {
  return Array.from({ length: 12 }, (_, index) => `${ano}${String(index + 1).padStart(2, "0")}`);
}
