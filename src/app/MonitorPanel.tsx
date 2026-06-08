"use client";

import { Plus, Radar, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";

type Municipio = {
  codigo_municipio: string;
  nome_municipio: string;
};

type Monitorado = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
  ativo: boolean;
  sincronizacao_automatica: boolean;
};

type MonitorPanelProps = {
  municipios: Municipio[];
  monitorados: Monitorado[];
  selectedCodigo: string;
  selectedAno: number;
};

type MonitorResult = {
  ok: boolean;
  message: string;
};

export function MonitorPanel({ municipios, monitorados, selectedCodigo, selectedAno }: MonitorPanelProps) {
  const [codigoMunicipio, setCodigoMunicipio] = useState(selectedCodigo);
  const [ano, setAno] = useState(String(selectedAno));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MonitorResult | null>(null);

  const selectedMunicipio = useMemo(
    () => municipios.find((item) => item.codigo_municipio === codigoMunicipio),
    [codigoMunicipio, municipios]
  );

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
        window.location.href = `/?municipio=${codigoMunicipio}&ano=${ano}#monitoramento`;
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
    <article className="panel monitor-panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">Monitoramento</span>
          <h2>Municipios e anos acompanhados</h2>
        </div>
        <span className="badge">{monitorados.length} escopos</span>
      </div>

      <div className="monitor-layout">
        <div className="monitor-form">
          <label>
            Municipio
            <select value={codigoMunicipio} onChange={(event) => setCodigoMunicipio(event.target.value)} disabled={saving}>
              {municipios.map((municipio) => (
                <option key={municipio.codigo_municipio} value={municipio.codigo_municipio}>
                  {municipio.nome_municipio} - {municipio.codigo_municipio}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ano
            <select value={ano} onChange={(event) => setAno(event.target.value)} disabled={saving}>
              {buildYears().map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="primary" onClick={submitMonitoramento} disabled={saving}>
            {saving ? <RotateCw size={17} /> : <Plus size={17} />} Cadastrar monitoramento
          </button>

          <div className="monitor-context">
            <Radar size={17} />
            <span>
              {selectedMunicipio?.nome_municipio ?? codigoMunicipio} / {ano} cria assinaturas dos endpoints padrao.
            </span>
          </div>

          {result ? <p className={result.ok ? "form-message success" : "form-message error"}>{result.message}</p> : null}
        </div>

        <div className="monitor-list">
          {monitorados.map((item) => (
            <a
              className={item.codigo_municipio === selectedCodigo && item.ano === selectedAno ? "monitor-item active" : "monitor-item"}
              href={`/?municipio=${item.codigo_municipio}&ano=${item.ano}#operacao`}
              key={`${item.codigo_municipio}-${item.exercicio_orcamento}`}
            >
              <span>{item.nome_municipio}</span>
              <strong>{item.ano}</strong>
              <em>{item.sincronizacao_automatica ? "auto" : "manual"}</em>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

function buildYears(): number[] {
  const current = new Date().getFullYear();
  const start = current - 6;
  const end = current + 1;
  const years: number[] = [];

  for (let year = end; year >= start; year -= 1) {
    years.push(year);
  }

  return years;
}
