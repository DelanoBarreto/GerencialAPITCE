import { createSupabaseAdminClient } from "../../../../lib/supabase/admin.js";
import { authorizeInternalOperation } from "../../../../lib/auth/operation.js";
import { createSupabaseServerClient } from "../../../../lib/supabase/server.js";
import { acquireOperationLock } from "../../../../lib/ops/operation-lock.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MonitorBody = {
  codigoMunicipio?: string;
  ano?: number;
};

export async function POST(request: Request) {
  const authorization = await authorizeInternalOperation(request);
  if (!authorization.ok) return authorization.response;

  let body: MonitorBody;
  try {
    body = (await request.json()) as MonitorBody;
  } catch {
    return Response.json({ ok: false, message: "JSON invalido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false, message: "Parametros invalidos." }, { status: 400 });
  }
  const codigoMunicipio = body.codigoMunicipio;
  const ano = body.ano;

  if (typeof codigoMunicipio !== "string" || !/^\d{3}$/.test(codigoMunicipio)) {
    return Response.json({ ok: false, message: "Codigo do municipio invalido." }, { status: 400 });
  }

  if (typeof ano !== "number" || !Number.isInteger(ano) || ano < 2000 || ano > 2099) {
    return Response.json({ ok: false, message: "Ano invalido." }, { status: 400 });
  }

  const userClient = await createSupabaseServerClient();
  const { data: municipios, error: municipioError } = await userClient.rpc("listar_municipios");
  const municipio = Array.isArray(municipios)
    ? municipios.find((item) => item?.codigo_municipio === codigoMunicipio)
    : null;
  const exercicio = `${ano}00`;
  const now = new Date().toISOString();

  // O catalogo da plataforma ja traz os 184 municipios do Ceara, entao basta
  // validar que o codigo existe — nao e mais preciso buscar no TCE.
  if (municipioError) {
    return Response.json({ ok: false, message: "Erro ao consultar o catalogo de municipios." }, { status: 500 });
  }

  if (!municipio) {
    return Response.json({ ok: false, message: "Municipio nao encontrado no catalogo." }, { status: 404 });
  }

  const release = await acquireOperationLock({
    key: `monitor:${codigoMunicipio}:${exercicio}`,
    userId: authorization.user.id,
    action: "monitor",
    codigoMunicipio,
    exercicio,
    target: codigoMunicipio
  });
  if (!release) {
    return Response.json({ ok: false, message: "Este cadastro ja esta em andamento." }, { status: 409 });
  }

  try {
  const supabase = createSupabaseAdminClient();

  const { error: monitorError } = await supabase.from("tce_municipios_monitorados").upsert(
    {
      codigo_municipio: codigoMunicipio,
      ativo: true,
      sincronizacao_automatica: true,
      exercicio_orcamento_padrao: exercicio,
      observacoes: "Municipio cadastrado pela interface operacional",
      updated_at: now
    },
    { onConflict: "codigo_municipio" }
  );

  if (monitorError) {
    throw monitorError;
  }

  const { error: exercicioError } = await supabase.from("tce_municipio_exercicios_monitorados").upsert(
    {
      codigo_municipio: codigoMunicipio,
      exercicio_orcamento: exercicio,
      ano,
      ativo: true,
      sincronizacao_automatica: true,
      observacoes: "Exercicio cadastrado pela interface operacional",
      updated_at: now
    },
    { onConflict: "codigo_municipio,exercicio_orcamento" }
  );

  if (exercicioError) {
    throw exercicioError;
  }

  const { data: endpoints, error: endpointsError } = await supabase
    .from("tce_endpoint_catalog")
    .select("endpoint")
    .eq("habilitado_por_padrao", true);

  if (endpointsError) {
    throw endpointsError;
  }

  const subscriptions = (endpoints ?? []).map((item) => ({
    codigo_municipio: codigoMunicipio,
    exercicio_orcamento: exercicio,
    endpoint: item.endpoint,
    ativo: true,
    sincronizacao_automatica: true,
    updated_at: now
  }));

  if (subscriptions.length > 0) {
    const { error: subscriptionError } = await supabase
      .from("tce_sync_subscriptions")
      .upsert(subscriptions, { onConflict: "codigo_municipio,exercicio_orcamento,endpoint" });

    if (subscriptionError) {
      throw subscriptionError;
    }
  }

  await release("ok");
  return Response.json({
    ok: true,
    message: `Monitoramento cadastrado: municipio ${codigoMunicipio}, exercicio ${exercicio}.`
  });
  } catch (error) {
    await release("erro", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ ok: false, message: "Falha interna ao cadastrar monitoramento." }, { status: 500 });
  }
}
