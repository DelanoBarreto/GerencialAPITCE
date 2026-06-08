# Checklist do projeto APITCE

Este checklist resume o estado atual e a ordem recomendada de continuidade.

## Estado já concluído

- Base do projeto criada em Next.js.
- Integração com Supabase.
- Sincronização inicial validada para Aracati `014`.
- Cargas confirmadas para `BAS`, `ORC` e `BAL`.
- Monitoramento de município/ano criado.
- Área admin criada.
- Páginas principais do admin existentes:
  - `/admin`
  - `/admin/municipios`
  - `/admin/municipios/[codigo]/[ano]`
  - `/admin/dados`
  - `/admin/logs`
  - `/admin/clientes`
- Layout admin ajustado para largura fixa de laptop.
- Documentação de processo criada e atualizada.

## O que falta fazer

### 1. Fechar o admin

- Deixar claro onde cadastra município/ano.
- Deixar claro onde atualiza dados.
- Deixar claro onde vê status.
- Deixar claro onde vê logs.
- Reduzir qualquer texto ou bloco que ainda confunda a operação.

### 2. Ampliar a cobertura da API

- Continuar depois do núcleo atual.
- Consolidar grupos e endpoints restantes.
- Tratar regras especiais e endpoints instáveis.
- Normalizar mais dados para relatórios gerenciais.

### 3. Melhorar o cadastro

- Buscar município direto na API quando não existir no banco.
- Permitir cadastro mais simples de município/ano.
- Atualizar status automaticamente após cadastro e sync.

### 4. Melhorar a operação

- Criar contagem real por endpoint e tabela.
- Atualizar status da interface sem depender tanto de recarregar.
- Automatizar rotina diária para detectar novidades.
- Baixar apenas o que mudou.

### 5. Preparar a área do cliente

- Criar `/dashboard`.
- Separar linguagem técnica do admin da linguagem do cliente.
- Mostrar apenas dados liberados por contrato.
- Não expor termos de API para o cliente final.

## Ordem recomendada de execução

1. Copiar o projeto para `C:\Antigravity\GerencialAPITCE`.
2. Abrir o novo workspace nessa pasta.
3. Validar que a aplicação sobe normalmente.
4. Fechar o fluxo de `Municipios`.
5. Fechar o fluxo de `Dados`.
6. Fechar o fluxo de `Logs`.
7. Ampliar cobertura da API.
8. Automatizar atualização diária.
9. Só depois iniciar a área do cliente.

## Testes de referência

- Sempre testar com `Aracati 2024`.
- Sempre testar com `Aracati 2025`.
- Conferir:
  - cadastro
  - atualização
  - status
  - logs
  - filtros
  - largura fixa da interface

## Regra visual

- A interface deve se comportar como uma tela de `14" a 15"`.
- Em monitores grandes, o conteúdo deve continuar centralizado e contido.
- O admin precisa ser claro, leve e direto.

