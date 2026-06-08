import { getSupabaseAdmin } from "../../../../lib/supabase/admin.js";
import { runNpmScriptStream } from "../../../../lib/ops/run-npm-script.js";

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

  const supabase = getSupabaseAdmin();
  const { data: group, error: groupError } = await supabase
    .from("tce_endpoint_groups")
    .select("slug")
    .eq("slug", grupo)
    .single();

  if (groupError || !group) {
    return Response.json({ ok: false, error: "Grupo nao encontrado no catalogo." }, { status: 404 });
  }

  const exercicio = `${ano}00`;
  const script = action === "sync" ? "sync:grupo" : "check:grupo";
  const args = [
    "--municipio", codigoMunicipio,
    "--grupo", grupo,
    "--exercicio", exercicio,
    "--data-inicial", `${ano}01`,
    "--data-final", `${ano}12`,
    "--default"
  ];

  if (action === "sync" && force) {
    args.push("--force");
  }

  const command = `npm run ${script} -- ${args.join(" ")}`;

  // Responde com Server-Sent Events (SSE)
  // O cliente recebe cada linha em tempo real, sem esperar o processo terminar
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: string) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      }

      // Envia o comando que será executado
      send("start", JSON.stringify({ command }));

      try {
        for await (const chunk of runNpmScriptStream(script, args)) {
          if (chunk.type === "line") {
            send("line", JSON.stringify({ text: chunk.text }));
          } else {
            // chunk.type === "done"
            send("done", JSON.stringify({ ok: chunk.exitCode === 0, exitCode: chunk.exitCode, command }));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send("error", JSON.stringify({ message }));
        send("done", JSON.stringify({ ok: false, exitCode: 1, command }));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
