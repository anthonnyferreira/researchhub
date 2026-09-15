"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Article = {
  pmid: string;
  doi: string | null;
  title: string;
  authors: string[];
  journal: string;
  pubdate: string;
  year: number | null;
  publicationTypes: string[];
  abstract: string | null;
  pubmedUrl: string;
  doiUrl: string | null;
  savedAt?: string;
};

type EvidenceNote = {
  objective?: string;
  population?: string;
  method?: string;
  finding?: string;
  limitation?: string;
};

const LIBRARY_KEY = "researchhub-scholar-library";
const NOTES_KEY = "researchhub-scholar-evidence-notes";

export default function BibliotecaPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [notes, setNotes] = useState<Record<string, EvidenceNote>>({});
  const [view, setView] = useState<"library" | "matrix">("library");

  useEffect(() => {
    try {
      setArticles(JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]"));
      setNotes(JSON.parse(localStorage.getItem(NOTES_KEY) || "{}"));
    } catch {
      setArticles([]);
      setNotes({});
    }
  }, []);

  const withAbstract = useMemo(() => articles.filter((article) => article.abstract).length, [articles]);

  function persistArticles(next: Article[]) {
    setArticles(next);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
  }

  function removeArticle(pmid: string) {
    persistArticles(articles.filter((article) => article.pmid !== pmid));
  }

  function updateNote(pmid: string, field: keyof EvidenceNote, value: string) {
    const next = { ...notes, [pmid]: { ...(notes[pmid] || {}), [field]: value } };
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-teal font-semibold">Biblioteca científica</p>
          <h1 className="font-display text-4xl md:text-5xl mt-3">A evidência do seu trabalho em um só lugar.</h1>
          <p className="text-ink-soft mt-4 leading-relaxed">Salve artigos encontrados no Radar Científico, leia os resumos e transforme cada referência em uma linha da sua matriz de evidências.</p>
        </div>
        <Link href="/descobrir" className="bg-teal text-white px-5 py-3 rounded-card text-sm font-medium text-center">+ Buscar artigos</Link>
      </div>

      <section className="grid sm:grid-cols-3 gap-3 mt-8">
        <Metric value={String(articles.length)} label="Artigos salvos" />
        <Metric value={String(withAbstract)} label="Com resumo disponível" />
        <Metric value={String(articles.filter((x) => x.doi).length)} label="Com DOI identificado" />
      </section>

      <div className="mt-8 flex gap-2 border-b border-line">
        <button onClick={() => setView("library")} className={`px-4 py-3 text-sm font-medium border-b-2 ${view === "library" ? "border-teal text-teal" : "border-transparent text-ink-soft"}`}>Artigos</button>
        <button onClick={() => setView("matrix")} className={`px-4 py-3 text-sm font-medium border-b-2 ${view === "matrix" ? "border-teal text-teal" : "border-transparent text-ink-soft"}`}>Matriz de evidências</button>
      </div>

      {articles.length === 0 ? (
        <div className="mt-8 border border-dashed border-line rounded-2xl p-10 text-center bg-white">
          <p className="font-display text-2xl">Sua biblioteca ainda está vazia.</p>
          <p className="text-sm text-ink-soft mt-2">Faça uma busca no Radar e adicione artigos relevantes ao seu projeto.</p>
          <Link href="/descobrir" className="inline-block mt-5 text-teal font-medium text-sm">Ir para o Radar Científico →</Link>
        </div>
      ) : view === "library" ? (
        <div className="mt-6 space-y-4">
          {articles.map((article) => (
            <article key={article.pmid} className="bg-white border border-line rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    {article.year && <span className="bg-teal-soft text-teal px-2 py-1 rounded-full">{article.year}</span>}
                    {article.publicationTypes?.slice(0, 2).map((type) => <span key={type}>{type}</span>)}
                  </div>
                  <h2 className="font-display text-xl md:text-2xl mt-3 leading-snug">{article.title}</h2>
                  <p className="text-sm text-ink-soft mt-2">{article.authors?.slice(0, 6).join(", ")}{article.authors?.length > 6 ? " et al." : ""}</p>
                  <p className="text-xs text-ink-soft/80 mt-1">{article.journal} · PMID {article.pmid}{article.doi ? ` · DOI ${article.doi}` : ""}</p>
                  {article.abstract && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-teal">Ler resumo</summary>
                      <p className="text-sm text-ink-soft leading-relaxed mt-3 max-w-4xl">{article.abstract}</p>
                    </details>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-xs">
                    <a href={article.pubmedUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">PubMed ↗</a>
                    {article.doiUrl && <a href={article.doiUrl} target="_blank" rel="noreferrer" className="text-teal hover:underline">DOI ↗</a>}
                  </div>
                </div>
                <button onClick={() => removeArticle(article.pmid)} className="self-start text-xs text-red-600 border border-red-200 px-3 py-2 rounded-card hover:bg-red-50">Remover</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="bg-amber-soft border border-amber/20 rounded-card p-4 text-sm text-ink-soft">
            A matriz é um instrumento de organização. Os campos abaixo devem ser preenchidos a partir da leitura crítica do artigo; o protótipo não inventa achados nem limitações que não estejam documentados.
          </div>
          {articles.map((article, index) => (
            <section key={article.pmid} className="bg-white border border-line rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-line bg-paper flex gap-4">
                <span className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-sm shrink-0">{index + 1}</span>
                <div>
                  <h2 className="font-medium leading-snug">{article.title}</h2>
                  <p className="text-xs text-ink-soft mt-1">{article.year || "Ano não informado"} · {article.journal || "Periódico não informado"} · PMID {article.pmid}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-5">
                <EvidenceField label="Objetivo" value={notes[article.pmid]?.objective || ""} onChange={(v) => updateNote(article.pmid, "objective", v)} />
                <EvidenceField label="População / amostra" value={notes[article.pmid]?.population || ""} onChange={(v) => updateNote(article.pmid, "population", v)} />
                <EvidenceField label="Método" value={notes[article.pmid]?.method || ""} onChange={(v) => updateNote(article.pmid, "method", v)} />
                <EvidenceField label="Principal achado" value={notes[article.pmid]?.finding || ""} onChange={(v) => updateNote(article.pmid, "finding", v)} />
                <EvidenceField label="Limitação" value={notes[article.pmid]?.limitation || ""} onChange={(v) => updateNote(article.pmid, "limitation", v)} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="bg-white border border-line rounded-card p-4"><p className="text-3xl font-semibold">{value}</p><p className="text-xs text-ink-soft mt-1">{label}</p></div>;
}

function EvidenceField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="p-4 border-b md:border-b-0 md:border-r border-line last:border-r-0">
      <label className="text-[11px] uppercase tracking-wider text-teal font-semibold">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={7} className="w-full mt-2 text-sm border-0 resize-y outline-none bg-transparent placeholder:text-ink-soft/40" placeholder="Registre após a leitura..." />
    </div>
  );
}
