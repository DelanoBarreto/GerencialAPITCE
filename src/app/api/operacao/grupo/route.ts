import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
import { authorizeInternalOperation } from "../../../../lib/auth/operation.js";
import { acquireOperationLock } from "../../../../lib/ops/operation-lock.js";
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
  const authorization = await authorizeInternalOperation(request);
  if (!authorization.ok) return authorization.response;

  let body: OperationBody;
  try {
    body = (await request.json()) as OperationBody;
  } catch {
    return Response.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)
    || (body.force !== undefined && typeof body.force !== "boolean")) {
    return Response.json({ ok: false, error: "Parametros invalidos." }, { status: 400 });
  }
  const { action, codigoMunicipio, ano, grupo } = body;
  const force = body.force ?? false;

  if (typeof action !== "string" || !allowedActions.has(action)) {
    return Response.json({ ok: false, error: "Acao invalida." }, { status: 400 });
  }

  if (typeof codigoMunicipio !== "string" || !/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, error: "Municipio invalido." }, { status: 400 });
  }

  if (typeof ano !== "number" || !Number.isInteger(ano) || ano < 2000 || ano > 2099) {
    return Response.json({ ok: false, error: "Ano invalido." }, { status: 400 });
  }

  if (typeof grupo !== "string" || !/^[a-z0-9_]+$/.test(grupo)) {
    return Response.json({ ok: false, error: "Grupo invalido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: group, error: groupError } = await supabase.from("tce_endpoint_groups").select("slug").eq("slug", grupo).single();

  if (groupError || !group) {
    return Response.json({ ok: false, error: "Grupo nao encontrado no catalogo." }, { status: 404 });
  }

  const exercicio = `${ano}00`;
  const release = await acquireOperationLock({
    key: `grupo:${codigoMunicipio}:${exercicio}:${grupo}`,
    userId: authorization.user.id,
    action,
    codigoMunicipio,
    exercicio,
    target: grupo
  });
  if (!release) {
    return Response.json({ ok: false, error: "Esta operacao ja esta em andamento." }, { status: 409 });
  }

  try {
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

      await release("ok");
      return Response.json({
        ok: true,
        exitCode: 0,
        output: "Operacao concluida. Consulte a auditoria."
      });
    } catch (err: any) {
      const detail = err instanceof Error ? err.message : "erro desconhecido";
      await release("erro", detail);
      return Response.json({
        ok: false,
        exitCode: 1,
        output: "Operacao nao concluida. Consulte a auditoria."
      }, { status: 500 });
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

  await release(result.exitCode === 0 ? "ok" : "erro", result.exitCode === 0 ? undefined : "execucao nao concluida");
  return Response.json({
    ok: result.exitCode === 0,
    exitCode: result.exitCode,
    output: result.exitCode === 0 ? "Operacao concluida. Consulte a auditoria." : "Operacao nao concluida. Consulte a auditoria."
  });
  } catch (error) {
    await release("erro", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ ok: false, error: "Falha interna ao executar a operacao." }, { status: 500 });
  }
}
