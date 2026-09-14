import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const rotas = [
  { path: "/admin", nome: "admin" },
  { path: "/gestao", nome: "gestao" },
  { path: "/apresentacao/aracati", nome: "apresentacao" },
  { path: "/admin/dados", nome: "admin-dados" },
  { path: "/admin/municipios", nome: "admin-municipios" }
];

const viewports = [
  { nome: "desktop", width: 1440, height: 900 },
  { nome: "mobile", width: 390, height: 844 }
];

mkdirSync(".screenshots", { recursive: true });

const browser = await chromium.launch();

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const rota of rotas) {
    try {
      await page.goto(`http://localhost:3000${rota.path}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.screenshot({ path: `.screenshots/${rota.nome}-${vp.nome}.png`, fullPage: true });
      console.log(`capturado ${rota.nome}-${vp.nome}`);
    } catch (error) {
      console.error(`falhou ${rota.nome}-${vp.nome}:`, error instanceof Error ? error.message : error);
    }
  }
  await page.close();
}

await browser.close();
