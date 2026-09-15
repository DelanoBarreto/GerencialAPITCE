import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.APITCE_TEST_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    for (const path of ["/", "/admin", "/gestao", "/gestao/014/202500", "/apresentacao/aracati", "/apresentacao/014/202500"]) {
      await page.goto(new URL(path, baseUrl).toString(), { waitUntil: "domcontentloaded" });
      assert.equal(new URL(page.url()).pathname, "/login", `${path} deve exigir login`);
      assert.equal(new URL(page.url()).searchParams.get("redirect"), path);
    }

    assert.equal(await page.locator('input[type="email"]').count(), 1, "formulario de login visivel");
    for (const path of ["/api/monitoramento/municipio", "/api/operacao/endpoint", "/api/operacao/grupo"]) {
      const response = await page.request.post(new URL(path, baseUrl).toString(), {
        data: {},
        headers: { Origin: new URL(baseUrl).origin }
      });
      assert.equal(response.status(), 401, `${path} deve rejeitar usuario anonimo`);
    }
    await page.close();
    console.log(`Acesso anonimo bloqueado em ${viewport.width}px.`);
  }
} finally {
  await browser.close();
}
