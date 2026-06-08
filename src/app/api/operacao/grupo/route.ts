import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
import { runNpmScript } from "../../../../lib/ops/run-npm-script.js";
import { runSyncGrupo } from "../../../../lib/tce/sync-runner.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedActions = new Set(["check", "sync"]);

type OperationBody = {
  action?: string;
  codigoMunicipio?: string;
  ano?: number;
  grupo?: string;
  force?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as OperationBody;
  const action = String(body.action ?? "");
  const codigoMunicipio = String(body.codigoMunicipio ?? "");
  const ano = Number(body.ano);
  const grupo = String(body.grupo ?? "");
  const force = Boolean(body.force);

  if (!allowedActions.has(action)) {
    return Response.json({ ok: false, error: "Acao invalida." }, { status: 400 });
  }

  if (!/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, error: "Municipio invalido." }, { status: 400 });
  }

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2099) {
    return Response.json({ ok: false, error: "Ano invalido." }, { status: 400 });
  }

  if (!/^[a-z0-9_]+$/.test(grupo)) {
    return Response.json({ ok: false, error: "Grupo invalido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: group, error: groupError } = await supabase.from("tce_endpoint_groups").select("slug").eq("slug", grupo).single();

  if (groupError || !group) {
    return Response.json({ ok: false, error: "Grupo nao encontrado no catalogo." }, { status: 404 });
  }

  const exercicio = `${ano}00`;

  if (action === "sync") {
    const output: string[] = [];
    const onLog = (msg: string) => output.push(msg);

    try {
      await runSyncGrupo({
        municipio: codigoMunicipio,
        grupo: grupo,
        exercicio: exercicio,
        dataInicial: `${ano}01`,
        dataFinal: `${ano}12`,
        onlyDefault: true,
        force: force
      }, onLog);

      return Response.json({
        ok: true,
        command: `runSyncGrupo(grupo=${grupo})`,
        exitCode: 0,
        output: output.join("\n")
      });
    } catch (err: any) {
      return Response.json({
        ok: false,
        command: `runSyncGrupo(grupo=${grupo})`,
        exitCode: 1,
        output: output.join("\n") + "\nError: " + err.message
      });
    }
  }

  const script = "check:grupo";
  const args = [
    "--municipio",
    codigoMunicipio,
    "--grupo",
    grupo,
    "--exercicio",
    exercicio,
    "--data-inicial",
    `${ano}01`,
    "--data-final",
    `${ano}12`,
    "--default"
  ];

  const result = await runNpmScript(script, args);

  return Response.json({
    ok: result.exitCode === 0,
    command: `npm run ${script} -- ${args.join(" ")}`,
    exitCode: result.exitCode,
    output: result.output
  });
}
