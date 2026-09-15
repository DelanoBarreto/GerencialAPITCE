import assert from "node:assert/strict";
import test from "node:test";
import { safeDestination } from "./redirect.js";
import { isAllowedRequestOrigin } from "./origin.js";

test("redirect de login aceita apenas rotas internas conhecidas", () => {
  assert.equal(safeDestination("/admin/dados"), "/admin/dados");
  assert.equal(safeDestination("/gestao/014/202500"), "/gestao/014/202500");
  assert.equal(safeDestination("/apresentacao/014/202500"), "/apresentacao/014/202500");
  assert.equal(safeDestination("https://example.org"), "/");
  assert.equal(safeDestination("//example.org"), "/");
  assert.equal(safeDestination("/%2F%2Fexample.org"), "/");
  assert.equal(safeDestination("/login"), "/");
});

test("POST exige Origin exato e configurado em producao", () => {
  const request = (origin: string | null) => ({
    url: "https://apitce.example.org/api/operacao/grupo",
    headers: new Headers(origin ? { origin } : {})
  });
  assert.equal(isAllowedRequestOrigin(request("https://apitce.example.org"), "https://apitce.example.org", true), true);
  assert.equal(isAllowedRequestOrigin(request("https://evil.example.org"), "https://apitce.example.org", true), false);
  assert.equal(isAllowedRequestOrigin(request("https://apitce.example.org.evil.com"), "https://apitce.example.org", true), false);
  assert.equal(isAllowedRequestOrigin(request(null), "https://apitce.example.org", true), false);
  assert.equal(isAllowedRequestOrigin(request("https://apitce.example.org"), undefined, true), false);
  assert.equal(isAllowedRequestOrigin(request("https://apitce.example.org"), undefined, false), true);
});
