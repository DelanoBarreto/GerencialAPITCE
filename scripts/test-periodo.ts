import assert from "node:assert/strict";
import { describePeriodo } from "../src/lib/periodo.js";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("lista vazia nao tem periodo", () => {
  const result = describePeriodo([]);
  assert.equal(result.inicio, null);
  assert.equal(result.fim, null);
  assert.equal(result.total, 0);
  assert.equal(result.continuo, true);
  assert.deepEqual(result.faltantes, []);
});

test("exercicio completo de 12 meses e continuo", () => {
  const meses = [
    "202501", "202502", "202503", "202504", "202505", "202506",
    "202507", "202508", "202509", "202510", "202511", "202512"
  ];
  const result = describePeriodo(meses);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202512");
  assert.equal(result.total, 12);
  assert.equal(result.continuo, true);
  assert.deepEqual(result.faltantes, []);
});

test("detecta competencia faltante no meio", () => {
  const result = describePeriodo(["202501", "202502", "202504"]);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202504");
  assert.equal(result.total, 3);
  assert.equal(result.continuo, false);
  assert.deepEqual(result.faltantes, ["202503"]);
});

test("ordena entrada fora de ordem", () => {
  const result = describePeriodo(["202503", "202501", "202502"]);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202503");
  assert.equal(result.continuo, true);
});

test("atravessa virada de ano", () => {
  const result = describePeriodo(["202511", "202512", "202601"]);
  assert.equal(result.inicio, "202511");
  assert.equal(result.fim, "202601");
  assert.equal(result.total, 3);
  assert.equal(result.continuo, true);
});

test("ignora duplicatas", () => {
  const result = describePeriodo(["202501", "202501", "202502"]);
  assert.equal(result.total, 2);
  assert.equal(result.continuo, true);
});

console.log(`\n${passed} teste(s) passaram.`);
