-- security_invoker: a view respeita o RLS de quem consulta, nao o de quem criou.
-- No banco antigo estas views eram SECURITY DEFINER, apontado como ERROR pelo linter.
create view tce.vw_tce_receitas_mensais with (security_invoker = true) as
select r.codigo_municipio,
  r.exercicio_orcamento,
  r.data_referencia_doc,
  substring(r.data_referencia_doc from 1 for 4)::integer as ano,
  substring(r.data_referencia_doc from 5 for 2)::integer as mes,
  r.codigo_orgao,
  coalesce(o.nome_orgao, r.codigo_orgao) as nome_orgao,
  r.codigo_unidade_orcamentaria,
  coalesce(u.nome_unidade, r.codigo_unidade_orcamentaria) as nome_unidade,
  sum(coalesce(r.valor_previsto_orcamento, 0::numeric)) as valor_previsto_orcamento,
  sum(coalesce(r.valor_arrecadacao_no_mes, 0::numeric)) as valor_arrecadacao_no_mes,
  sum(coalesce(r.valor_arrecadacao_ate_mes, 0::numeric)) as valor_arrecadacao_ate_mes,
  sum(coalesce(r.valor_anulacoes_no_mes, 0::numeric)) as valor_anulacoes_no_mes,
  sum(coalesce(r.valor_anulacoes_ate_mes, 0::numeric)) as valor_anulacoes_ate_mes,
  count(*) as quantidade_linhas
from tce.tce_balancetes_receitas_orcamentarias r
  left join tce.tce_orgaos o
    on o.codigo_municipio = r.codigo_municipio
   and o.exercicio_orcamento = r.exercicio_orcamento
   and o.codigo_orgao = r.codigo_orgao
  left join tce.tce_unidades_orcamentarias u
    on u.codigo_municipio = r.codigo_municipio
   and u.exercicio_orcamento = r.exercicio_orcamento
   and u.codigo_orgao = r.codigo_orgao
   and u.codigo_unidade_orcamentaria = r.codigo_unidade_orcamentaria
group by r.codigo_municipio, r.exercicio_orcamento, r.data_referencia_doc,
         r.codigo_orgao, o.nome_orgao, r.codigo_unidade_orcamentaria, u.nome_unidade;

create view tce.vw_tce_despesas_mensais with (security_invoker = true) as
select d.codigo_municipio,
  d.exercicio_orcamento,
  d.data_referencia_doc,
  substring(d.data_referencia_doc from 1 for 4)::integer as ano,
  substring(d.data_referencia_doc from 5 for 2)::integer as mes,
  d.codigo_orgao,
  coalesce(o.nome_orgao, d.codigo_orgao) as nome_orgao,
  d.codigo_unidade_orcamentaria,
  coalesce(u.nome_unidade, d.codigo_unidade_orcamentaria) as nome_unidade,
  sum(coalesce(d.valor_fixado_orcamento, 0::numeric)) as valor_fixado_orcamento,
  sum(coalesce(d.valor_suplementado_no_mes, 0::numeric)) as valor_suplementado_no_mes,
  sum(coalesce(d.valor_suplementado_ate_mes, 0::numeric)) as valor_suplementado_ate_mes,
  sum(coalesce(d.valor_empenhado_no_mes, 0::numeric)) as valor_empenhado_no_mes,
  sum(coalesce(d.valor_empenhado_ate_mes, 0::numeric)) as valor_empenhado_ate_mes,
  sum(coalesce(d.valor_liquidado_no_mes, 0::numeric)) as valor_liquidado_no_mes,
  sum(coalesce(d.valor_liquidado_ate_mes, 0::numeric)) as valor_liquidado_ate_mes,
  sum(coalesce(d.valor_pago_no_mes, 0::numeric)) as valor_pago_no_mes,
  sum(coalesce(d.valor_pago_ate_mes, 0::numeric)) as valor_pago_ate_mes,
  sum(coalesce(d.valor_saldo_dotacao, 0::numeric)) as valor_saldo_dotacao,
  count(*) as quantidade_linhas
from tce.tce_balancetes_despesas_orcamentarias d
  left join tce.tce_orgaos o
    on o.codigo_municipio = d.codigo_municipio
   and o.exercicio_orcamento = d.exercicio_orcamento
   and o.codigo_orgao = d.codigo_orgao
  left join tce.tce_unidades_orcamentarias u
    on u.codigo_municipio = d.codigo_municipio
   and u.exercicio_orcamento = d.exercicio_orcamento
   and u.codigo_orgao = d.codigo_orgao
   and u.codigo_unidade_orcamentaria = d.codigo_unidade_orcamentaria
group by d.codigo_municipio, d.exercicio_orcamento, d.data_referencia_doc,
         d.codigo_orgao, o.nome_orgao, d.codigo_unidade_orcamentaria, u.nome_unidade;

create view tce.vw_tce_execucao_orcamentaria_mensal with (security_invoker = true) as
select coalesce(r.codigo_municipio, d.codigo_municipio) as codigo_municipio,
  coalesce(r.exercicio_orcamento, d.exercicio_orcamento) as exercicio_orcamento,
  coalesce(r.data_referencia_doc, d.data_referencia_doc) as data_referencia_doc,
  coalesce(r.ano, d.ano) as ano,
  coalesce(r.mes, d.mes) as mes,
  coalesce(r.codigo_orgao, d.codigo_orgao) as codigo_orgao,
  coalesce(r.nome_orgao, d.nome_orgao) as nome_orgao,
  coalesce(r.codigo_unidade_orcamentaria, d.codigo_unidade_orcamentaria) as codigo_unidade_orcamentaria,
  coalesce(r.nome_unidade, d.nome_unidade) as nome_unidade,
  coalesce(r.valor_previsto_orcamento, 0::numeric) as receita_prevista_orcamento,
  coalesce(r.valor_arrecadacao_no_mes, 0::numeric) as receita_arrecadada_no_mes,
  coalesce(r.valor_arrecadacao_ate_mes, 0::numeric) as receita_arrecadada_ate_mes,
  coalesce(d.valor_fixado_orcamento, 0::numeric) as despesa_fixada_orcamento,
  coalesce(d.valor_empenhado_no_mes, 0::numeric) as despesa_empenhada_no_mes,
  coalesce(d.valor_empenhado_ate_mes, 0::numeric) as despesa_empenhada_ate_mes,
  coalesce(d.valor_liquidado_no_mes, 0::numeric) as despesa_liquidada_no_mes,
  coalesce(d.valor_liquidado_ate_mes, 0::numeric) as despesa_liquidada_ate_mes,
  coalesce(d.valor_pago_no_mes, 0::numeric) as despesa_paga_no_mes,
  coalesce(d.valor_pago_ate_mes, 0::numeric) as despesa_paga_ate_mes,
  coalesce(d.valor_saldo_dotacao, 0::numeric) as despesa_saldo_dotacao
from tce.vw_tce_receitas_mensais r
  full join tce.vw_tce_despesas_mensais d
    on d.codigo_municipio = r.codigo_municipio
   and d.exercicio_orcamento = r.exercicio_orcamento
   and d.data_referencia_doc = r.data_referencia_doc
   and d.codigo_orgao = r.codigo_orgao
   and d.codigo_unidade_orcamentaria = r.codigo_unidade_orcamentaria;
