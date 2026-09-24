import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const migrationsDir = path.join(root, "supabase", "migrations");
const ids = {
  viewer014: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa014",
  viewer001: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001",
  suspended: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002",
  tenantAdmin: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  superadmin: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  unbound: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  target: "ffffffff-ffff-4fff-8fff-ffffffffffff"
};

const db = new PGlite();

async function runFile(file) {
  const sql = await readFile(file, "utf8");
  try {
    await db.exec(sql);
  } catch (error) {
    throw new Error(`SQL falhou em ${path.basename(file)}: ${error.message}`, { cause: error });
  }
}

async function asRole(role, userId, callback) {
  await db.exec(`set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  try {
    return await callback();
  } finally {
    await db.exec("reset role; reset request.jwt.claim.sub;");
  }
}

async function rows(sql) {
  return (await db.query(sql)).rows;
}

try {
  await runFile(path.join(root, "supabase", "tests", "fixture-shared-local.sql"));
  const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
  assert.equal(files.length, 14, "11 migrations historicas mais 3 migrations novas");
  for (const file of files) await runFile(path.join(migrationsDir, file));

  await db.exec(`
    insert into auth.users (id, encrypted_password) values
      ('${ids.viewer014}', 'hash-local'), ('${ids.viewer001}', 'hash-local'),
      ('${ids.suspended}', 'hash-local'), ('${ids.superadmin}', 'hash-local'),
      ('${ids.tenantAdmin}', 'hash-local'), ('${ids.unbound}', 'hash-local'),
      ('${ids.target}', 'hash-local');
    insert into plataforma.assinaturas (id, organizacao_id, sistema, status) values
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000014', 'tce', 'ativa'),
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'tce', 'ativa'),
      (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'tce', 'suspensa');
    insert into plataforma.usuarios_sistema (auth_user_id, sistema, organizacao_id, papel, nome, status) values
      ('${ids.viewer014}', 'tce', '00000000-0000-0000-0000-000000000014', 'viewer', 'Viewer 014', 'ativo'),
      ('${ids.viewer001}', 'tce', '00000000-0000-0000-0000-000000000001', 'viewer', 'Viewer 001', 'ativo'),
      ('${ids.suspended}', 'tce', '00000000-0000-0000-0000-000000000002', 'viewer', 'Viewer suspenso', 'ativo'),
      ('${ids.tenantAdmin}', 'tce', '00000000-0000-0000-0000-000000000014', 'tenant_admin', 'Admin municipal', 'ativo'),
      ('${ids.superadmin}', 'tce', null, 'superadmin', 'Equipe interna', 'ativo');
    insert into tce.tce_dados_orcamentos (codigo_municipio, exercicio_orcamento) values
      ('014', '202500'), ('001', '202500');
    insert into tce.tce_balancetes_receitas_orcamentarias
      (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria,
       codigo_rubrica, data_referencia_doc, codigo_fonte, valor_arrecadacao_no_mes) values
      ('014', '202500', '01', '01', '1', '202501', '1', 100),
      ('001', '202500', '01', '01', '1', '202501', '1', 200);
  `);

  assert.deepEqual(await rows(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='tce' and p.prosecdef order by p.proname`), [], "schema exposto sem SECURITY DEFINER");
  assert.equal((await rows("select count(*)::int total from pg_policies where schemaname='tce' and 'public'=any(roles)"))[0].total, 0);
  assert.equal((await rows("select to_regprocedure('tce.municipios_permitidos()') is null removed"))[0].removed, true);
  assert.equal((await rows("select has_schema_privilege('anon','tce','USAGE') allowed"))[0].allowed, false);
  assert.equal((await rows("select has_schema_privilege('authenticated','plataforma','USAGE') allowed"))[0].allowed, false);
  assert.equal((await rows("select has_function_privilege('anon','tce.meu_papel()','EXECUTE') allowed"))[0].allowed, false);
  assert.equal((await rows(`select count(*)::int total from pg_indexes where schemaname='tce' and indexname in
    ('tce_endpoint_catalog_grupo_slug_idx','tce_sync_availability_checks_codigo_municipio_idx',
     'tce_sync_availability_checks_endpoint_idx','tce_sync_subscriptions_endpoint_idx')`))[0].total, 4);

  await asRole("anon", null, async () => {
    await assert.rejects(db.query("select * from tce.tce_dados_orcamentos"), /permission denied/);
    await assert.rejects(db.query("select tce.meu_papel()"), /permission denied/);
  });

  await asRole("authenticated", ids.unbound, async () => {
    assert.equal((await rows("select tce.meu_papel() papel"))[0].papel, null);
    assert.deepEqual(await rows("select * from tce.listar_municipios()"), []);
    assert.deepEqual(await rows("select codigo_municipio from tce.tce_dados_orcamentos"), []);
    assert.deepEqual(await rows("select codigo_municipio from tce.vw_tce_execucao_orcamentaria_mensal"), []);
    await assert.rejects(db.query("select * from plataforma.catalogo_municipios"), /permission denied/);
    assert.deepEqual(await rows("select slug from tce.tce_endpoint_groups"), []);
  });

  await asRole("authenticated", ids.viewer014, async () => {
    assert.equal((await rows("select tce.meu_papel() papel"))[0].papel, "viewer");
    assert.deepEqual((await rows("select codigo_municipio from tce.listar_municipios()")), [{ codigo_municipio: "014" }]);
    assert.equal((await rows("select tce.tem_acesso_municipio('001') allowed"))[0].allowed, false);
    assert.deepEqual(await rows("select codigo_municipio from tce.tce_dados_orcamentos"), [{ codigo_municipio: "014" }]);
    assert.deepEqual(await rows("select codigo_municipio, receita_arrecadada_no_mes from tce.vw_tce_execucao_orcamentaria_mensal"),
      [{ codigo_municipio: "014", receita_arrecadada_no_mes: "100.00" }]);
    await assert.rejects(db.query("insert into tce.tce_dados_orcamentos (codigo_municipio, exercicio_orcamento) values ('014','202600')"), /permission denied/);
    await assert.rejects(db.query("select * from tce.tce_operacoes_auditoria"), /permission denied/);
    await assert.rejects(db.query("select * from tce.municipios"), /permission denied/);
    await assert.rejects(db.query(`select tce.vincular_usuario_existente('${ids.target}','014','viewer','Nova conta')`), /Operacao restrita/);
  });

  await asRole("authenticated", ids.viewer001, async () => {
    assert.deepEqual(await rows("select codigo_municipio from tce.tce_dados_orcamentos"), [{ codigo_municipio: "001" }]);
    assert.deepEqual(await rows("select codigo_municipio from tce.vw_tce_execucao_orcamentaria_mensal"), [{ codigo_municipio: "001" }]);
  });

  await asRole("authenticated", ids.suspended, async () => {
    assert.equal((await rows("select tce.meu_papel() papel"))[0].papel, null);
    assert.deepEqual(await rows("select * from tce.listar_municipios()"), []);
  });

  await asRole("authenticated", ids.tenantAdmin, async () => {
    assert.equal((await rows("select tce.meu_papel() papel"))[0].papel, "tenant_admin");
    assert.equal((await rows("select tce.sou_superadmin() allowed"))[0].allowed, false);
    await assert.rejects(db.query(`select tce.vincular_usuario_existente('${ids.target}','014','viewer','Nova conta')`), /Operacao restrita/);
  });

  await db.query("update auth.users set deleted_at=now() where id=$1", [ids.viewer014]);
  await asRole("authenticated", ids.viewer014, async () => {
    assert.equal((await rows("select tce.meu_papel() papel"))[0].papel, null);
    assert.deepEqual(await rows("select * from tce.listar_municipios()"), []);
    assert.deepEqual(await rows("select codigo_municipio from tce.tce_dados_orcamentos"), []);
    assert.deepEqual(await rows("select codigo_municipio from tce.vw_tce_execucao_orcamentaria_mensal"), []);
  });
  await db.query("update auth.users set deleted_at=null where id=$1", [ids.viewer014]);

  await asRole("authenticated", ids.superadmin, async () => {
    assert.equal((await rows("select tce.sou_superadmin() allowed"))[0].allowed, true);
    assert.equal((await rows("select count(*)::int total from tce.listar_municipios()"))[0].total, 3);
    assert.equal((await rows("select count(*)::int total from tce.tce_dados_orcamentos"))[0].total, 2);
    const result = await rows(`select tce.vincular_usuario_existente('${ids.target}','014','viewer','Nova conta') id`);
    assert.equal(result.length, 1);
  });
  assert.equal((await rows(`select count(*)::int total from plataforma.usuarios_sistema where auth_user_id='${ids.target}' and sistema='tce'`))[0].total, 1);

  console.log("Migrations TCE: sintaxe, grants, RPCs e isolamento RLS passaram na fixture PostgreSQL local.");
} finally {
  await db.close();
}
