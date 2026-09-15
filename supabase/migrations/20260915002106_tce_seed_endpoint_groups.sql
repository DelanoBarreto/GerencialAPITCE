insert into tce.tce_endpoint_groups (slug, nome, ordem) values
('auxiliares','Auxiliares',1),
('bas','Documentação de Informações Básicas (BAS)',2),
('orc','Documentação referente ao Orçamento Municipal (ORC)',3),
('bal','Documentação referente aos Balancetes (BAL)',4),
('documentacao_comprobatoria_de_receitas_dcr','Documentação Comprobatória de Receitas (DCR)',5),
('processos_administrativos_para_contratacoes_lco','Processos Administrativos para Contratações (LCO)',6),
('documentacao_referente_a_processos_de_parcerias_com_osc_osc','Documentação referente a Processos de Parcerias com OSC (OSC)',7),
('crd','Documentação referente à Abertura de Créditos Adicionais (CRD)',8),
('out','Outros Tipos de Documentos (OUT)',9),
('ose','Documentação de Obras Municipais ou Serviços de Engenharia (OSE)',10),
('cpf','Cadastro de Pessoal e Folha (CPF)',11),
('documentacao_referente_ao_regime_proprio_de_previdencia_rpp','Documentação referente ao Regime Próprio de Previdência (RPP)',12),
('documentacao_de_controle_do_patrimonio_municipal_pat','Documentação de Controle do Patrimônio Municipal (PAT)',13),
('documentacao_referente_a_frota_de_veiculos_vcl','Documentação referente à frota de veículos (VCL)',14),
('documentacao_comprobatoria_de_despesas_dcd','Documentação Comprobatória de Despesas (DCD)',15)
on conflict (slug) do nothing;
