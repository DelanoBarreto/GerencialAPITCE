# Supabase do Gerencial APITCE

Projeto compartilhado: `PortalGov-Producao`, ref `omcbfuiyaeakbsqbzgqk`. Este repositorio e dono dos schemas `tce` (Data API controlada) e `tce_internal` (funcoes privilegiadas, **sempre fora da Data API**). `plataforma` pertence a camada multi-sistema; `portalgov` pertence ao PortalGov. Nunca usar `db reset`, `db push` indiscriminado ou as migrations de `legacy-apitce-isolated/` no projeto compartilhado.

`migrations/20260915000925_*` a `20260915002953_*` sao copias exatas dos inputs de migration do historico local do Claude, com os timestamps presentes em `supabase_migrations.schema_migrations` remoto. A migration `vincular_pessoa_existente` de 20260915002307 pertence ao PortalGov e nao foi copiada para este repositorio. As novas migrations TCE `20260915160000_*` a `20260915160200_*` estao **somente locais**, aguardando backup, revisao, autorizacao e testes. O CLI Supabase nao estava instalado durante a preparacao; os nomes novos seguem o formato timestamp remoto, nao foram gerados pelo CLI.

Para conferir as onze copias exatas no computador que tem o historico Claude:

```powershell
node scripts/extract-tce-migrations.mjs 'CAMINHO_DO_HISTORICO.jsonl' --verify
```

Consultas somente leitura recomendadas antes de aplicar qualquer migration:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
select schemaname, tablename, policyname, roles, cmd from pg_policies where schemaname = 'tce';
select n.nspname, c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('tce', 'plataforma', 'portalgov') and c.relkind = 'r';
```

Teste de contrato local, sem Docker, credenciais ou copia dos dados reais:

```powershell
npm run test:db:local
```

O teste aplica as 11 migrations historicas e as 3 novas em um PostgreSQL PGlite em memoria, com uma fixture minima de `plataforma`/`auth`; cobre grants, RPCs, RLS, assinatura suspensa, identidade excluida e views invoker. **Nao prova paridade com o Supabase remoto nem substitui JWTs reais**. Antes de DDL remoto, capturar backup das definicoes/contagens de `tce` e testar as tres migrations novas em uma base isolada compativel. Aplicar **somente** as tres novas migrations, na ordem timestamp, com revisao de diff de objetos afetados; nao reaplicar as onze historicas. A Data API de `tce` so e habilitada depois dos testes de anon/authenticated/municipio. `plataforma` e `tce_internal` devem continuar fora da lista de exposed schemas.

Depois da aplicacao, consultar as RPCs como um usuario Supabase real (nao como `postgres` nem `service_role`), conferir grants/RLS e executar os advisors de seguranca. Detalhes de autorizacao e rollout: `docs/42-ARQUITETURA-SEGURANCA-APITCE.md`.
