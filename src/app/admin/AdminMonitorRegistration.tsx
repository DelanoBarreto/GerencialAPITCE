"use client";

import { Plus, RotateCw } from "lucide-react";
import { useState } from "react";

type MunicipioOption = {
  codigo_municipio: string;
  nome_municipio: string;
};

type MonitorResult = {
  ok: boolean;
  message: string;
};

type AdminMonitorRegistrationProps = {
  municipios: MunicipioOption[];
  defaultCodigo: string;
};

export function AdminMonitorRegistration({ municipios, defaultCodigo }: AdminMonitorRegistrationProps) {
  const [codigoMunicipio, setCodigoMunicipio] = useState(defaultCodigo);
  const [ano, setAno] = useState("2025");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MonitorResult | null>(null);

  async function submitMonitoramento() {
    setSaving(true);
    setResult(null);

    try {
      const response = await fetch("/api/monitoramento/municipio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoMunicipio,
          ano: Number(ano)
        })
      });
      const payload = (await response.json()) as MonitorResult;
      setResult(payload);

      if (payload.ok) {
        setTimeout(() => {
          window.location.href = `/admin/municipios`;
        }, 900);
      }
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "Erro desconhecido."
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-form-grid">
      <div className="admin-test-scope">
        Teste padrao: <strong>ARACATI - 014 / 2025</strong>
      </div>
      <label>
        Município
        <select value={codigoMunicipio} onChange={(event) => setCodigoMunicipio(event.target.value)} disabled={saving}>
          {municipios.map((municipio) => (
            <option value={municipio.codigo_municipio} key={municipio.codigo_municipio}>
              {municipio.nome_municipio} - {municipio.codigo_municipio}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ano
        <select value={ano} onChange={(event) => setAno(event.target.value)} disabled={saving}>
          {buildYears().map((year) => (
            <option value={year} key={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="admin-sync-button" onClick={submitMonitoramento} disabled={saving || municipios.length === 0}>
        {saving ? <RotateCw size={17} /> : <Plus size={17} />}
        {saving ? "Cadastrando..." : "Cadastrar município/ano"}
      </button>
      {result ? <p className={result.ok ? "admin-form-message success" : "admin-form-message error"}>{result.message}</p> : null}
    </div>
  );
}

function buildYears(): number[] {
  const current = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, index) => current + 1 - index);
  return years.includes(2025) ? years : [2025, ...years];
}
