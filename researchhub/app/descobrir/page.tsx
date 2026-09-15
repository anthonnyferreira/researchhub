"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Result = {
  topic: string;
  sources: { pubmed: { total: number; recent: number; systematicReviews: number; clinicalTrials: number }; crossref: { total: number | null } };
  timeline: { year: number; count: number }[];
  signals: { breadth: "very_broad" | "broad" | "balanced" | "niche" | "scarce"; trend: "growing" | "stable" | "declining"; recentRatio: number };
  methodology: string;
};

const breadthLabels = {
  very_broad: "Muito amplo",
  broad: "Amplo",
  balanced: "Bom ponto de partida",
  niche: "Nicho específico",
  scarce: "Literatura escassa",
};

const trendLabels = { growing: "Em crescimento", stable: "Estável", declining: "Em redução" };

export default function DiscoverPage() {
  const [topic, setTopic] = useState("semaglutide depression");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxTimeline = useMemo(() => Math.max(1, ...(result?.timeline.map((x) => x.count) ?? [1])), [result]);

  async function analyze(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch("/api/literature/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erro na busca");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível analisar o tema.");
    } finally { setLoading(false); }
  }

  const refinements = result ? [
    `${result.topic} AND young adults`,
    `${result.topic} AND clinical outcomes`,
    `${result.topic} AND systematic review`,
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-teal font-semibold">Radar científico</p>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Seu tema tem espaço para investigação?</h1>
        <p className="text-ink-soft mt-4 leading-relaxed">Digite um tema, hipótese ou combinação de termos. O protótipo consulta bases científicas em tempo real e transforma a busca em sinais de decisão.</p>
      </div>

      <form onSubmit={analyze} className="mt-8 bg-white border border-line rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 shadow-sm">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 border border-line rounded-card px-4 py-3 outline-none focus:border-teal" placeholder="Ex.: semaglutide depression" />
        <button disabled={loading} className="bg-teal text-white px-6 py-3 rounded-card font-medium disabled:opacity-50">{loading ? "Consultando bases..." : "Analisar tema"}</button>
      </form>
      <p className="text-xs text-ink-soft/70 mt-2">Dica: termos em inglês costumam recuperar melhor a literatura biomédica internacional.</p>
      {error && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-card text-sm">{error}</div>}

      {!result && !loading && (
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {["cardiac rehabilitation elderly", "artificial intelligence melanoma", "sleep quality medical residents"].map((example) => (
            <button key={example} onClick={() => setTopic(example)} className="text-left bg-white border border-line rounded-card p-4 hover:border-teal transition-colors">
              <span className="text-xs text-teal uppercase tracking-wide">Exemplo</span><p className="mt-2 text-sm font-medium">{example}</p>
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-6">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric value={result.sources.pubmed.total.toLocaleString("pt-BR")} label="Resultados no PubMed" />
            <Metric value={result.sources.pubmed.recent.toLocaleString("pt-BR")} label="Últimos 5 anos" />
            <Metric value={result.sources.pubmed.systematicReviews.toLocaleString("pt-BR")} label="Revisões sistemáticas" />
            <Metric value={result.sources.pubmed.clinicalTrials.toLocaleString("pt-BR")} label="Ensaios clínicos" />
          </section>

          <section className="grid lg:grid-cols-[1.1fr_.9fr] gap-5">
            <div className="bg-white border border-line rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-ink-soft">Evolução por ano</p>
              <div className="h-56 flex items-end gap-2 mt-6 border-b border-line pb-2">
                {result.timeline.map((item) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    <span className="text-[10px] text-ink-soft">{item.count}</span>
                    <div className="w-full max-w-10 bg-teal rounded-t-sm" style={{ height: `${Math.max(4, (item.count / maxTimeline) * 170)}px` }} />
                    <span className="text-[10px] text-ink-soft">{item.year}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-teal-soft border border-teal/20 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-teal">Leitura do tema</p>
                <h2 className="font-display text-2xl mt-2">{breadthLabels[result.signals.breadth]}</h2>
                <p className="text-sm text-ink-soft mt-2">Tendência: <strong className="text-ink">{trendLabels[result.signals.trend]}</strong>. Aproximadamente {Math.round(result.signals.recentRatio * 100)}% dos resultados recuperados estão nos últimos cinco anos.</p>
              </div>
              <div className="bg-white border border-line rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-ink-soft">Cobertura complementar</p>
                <p className="text-2xl font-semibold mt-2">{result.sources.crossref.total === null ? "—" : result.sources.crossref.total.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-ink-soft mt-1">registros recuperados no Crossref para o termo bibliográfico.</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-line rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div><p className="text-xs uppercase tracking-widest text-teal">Próxima decisão</p><h2 className="font-display text-2xl mt-2">Teste recortes mais específicos</h2></div>
              <Link href={`/meu-trabalho?tema=${encodeURIComponent(result.topic)}`} className="bg-ink text-white px-5 py-2.5 rounded-card text-sm font-medium text-center">Usar este tema no projeto</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-5">
              {refinements.map((item) => <button key={item} onClick={() => setTopic(item)} className="text-left border border-line rounded-card p-4 hover:border-teal hover:bg-teal-soft transition-colors"><p className="text-sm font-medium">{item}</p><span className="text-xs text-teal mt-2 inline-block">Analisar este recorte →</span></button>)}
            </div>
          </section>

          <p className="text-xs text-ink-soft/70">{result.methodology}</p>
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="bg-white border border-line rounded-card p-4"><p className="text-2xl md:text-3xl font-semibold tracking-tight">{value}</p><p className="text-xs text-ink-soft mt-1">{label}</p></div>;
}
