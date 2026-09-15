import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "../supabase/admin.js";

type OperationContext = {
  key: string;
  userId: string;
  action: string;
  codigoMunicipio: string;
  exercicio: string;
  target: string;
};

export async function acquireOperationLock(context: OperationContext) {
  const supabase = createSupabaseAdminClient();
  const operationId = randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const { error: expiredError } = await supabase
    .from("tce_operacoes_ativas")
    .delete()
    .eq("chave", context.key)
    .lt("expires_at", new Date().toISOString());
  if (expiredError) throw expiredError;

  const { error } = await supabase.from("tce_operacoes_ativas").insert({
    chave: context.key,
    operacao_id: operationId,
    auth_user_id: context.userId,
    expires_at: expiresAt
  });

  if (error?.code === "23505") return null;
  if (error) throw error;

  const { error: auditError } = await supabase.from("tce_operacoes_auditoria").insert({
    id: operationId,
    auth_user_id: context.userId,
    acao: context.action,
    codigo_municipio: context.codigoMunicipio,
    exercicio_orcamento: context.exercicio,
    alvo: context.target,
    status: "executando"
  });
  if (auditError) {
    await supabase.from("tce_operacoes_ativas").delete().eq("chave", context.key).eq("operacao_id", operationId);
    throw auditError;
  }

  return async (status: "ok" | "erro", detail?: string) => {
    const results = await Promise.all([
      supabase.from("tce_operacoes_ativas").delete().eq("chave", context.key).eq("operacao_id", operationId),
      supabase.from("tce_operacoes_auditoria").update({
        status,
        detalhe: detail ? "Falha durante a operacao; consultar logs internos." : null,
        finished_at: new Date().toISOString()
      }).eq("id", operationId)
    ]);
    for (const result of results) if (result.error) throw result.error;
  };
}
