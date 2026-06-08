import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
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
  const body = (await request.json()) as EndpointOperationBody;
  const action = String(body.action ?? "");
  const codigoMunicipio = String(body.codigoMunicipio ?? "");
  const ano = Number(body.ano);
  const endpoint = String(body.endpoint ?? "");

  if (!allowedActions.has(action)) {
    return Response.json({ ok: false, error: "Acao invalida." }, { status: 400 });
  }

  if (!/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, error: "Municipio invalido." }, { status: 400 });
  }

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2099) {
    return Response.json({ ok: false, error: "Ano invalido." }, { status: 400 });
  }

  if (!/^[a-z0-9_]+$/.test(endpoint)) {
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

  const result = await runEndpointOperation(action as "check" | "sync", codigoMunicipio, exercicio, ano, catalog as CatalogRow);

  return Response.json({
    ok: result.exitCode === 0,
    command: result.command,
    exitCode: result.exitCode,
    output: result.output
  });
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
