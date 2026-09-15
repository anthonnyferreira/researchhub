"use client";

import { useEffect, useMemo, useState } from "react";

const stages = ["Tema e pergunta", "Objetivos e hipótese", "Desenho do estudo", "População e critérios", "Desfechos e variáveis", "Métodos e análise", "Referências", "Manuscrito"];

type Draft = { theme: string; question: string; objective: string; studyType: string; population: string; outcome: string };

export default function MeuTrabalhoPage() {
  const [theme, setTheme] = useState("");
  const [question, setQuestion] = useState("");
  const [objective, setObjective] = useState("");
  const [studyType, setStudyType] = useState("Observacional transversal");
  const [population, setPopulation] = useState("");
  const [outcome, setOutcome] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tema");
    const stored = window.localStorage.getItem("researchhub-scholar-draft");
    if (stored) {
      try {
        const draft = JSON.parse(stored) as Draft;
        setTheme(fromUrl || draft.theme || "");
        setQuestion(draft.question || "");
        setObjective(draft.objective || "");
        setStudyType(draft.studyType || "Observacional transversal");
        setPopulation(draft.population || "");
        setOutcome(draft.outcome || "");
        return;
      } catch {}
    }
    if (fromUrl) setTheme(fromUrl);
  }, []);

  const completed = useMemo(() => [theme, question, objective, population, outcome].filter(Boolean).length, [theme, question, objective, population, outcome]);
  const progress = Math.round((completed / 5) * 100);

  function suggestQuestion() {
    if (!theme.trim()) return;
    setQuestion(`Em uma população definida, qual é a associação entre ${theme.toLowerCase()} e o principal desfecho clínico de interesse?`);
  }

  function suggestObjective() {
    if (!theme.trim()) return;
    setObjective(`Avaliar a relação entre ${theme.toLowerCase()} e desfechos clínicos relevantes na população estudada.`);
  }

  function saveDraft() {
    const draft: Draft = { theme, question, objective, studyType, population, outcome };
    window.localStorage.setItem("researchhub-scholar-draft", JSON.stringify(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[260px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 self-start">
        <p className="text-xs uppercase tracking-widest text-teal font-semibold">Seu projeto</p>
        <h1 className="font-display text-2xl mt-2">Construtor científico</h1>
        <div className="mt-5 h-2 bg-line rounded-full overflow-hidden"><div className="h-full bg-teal" style={{ width: `${progress}%` }} /></div>
        <p className="text-xs text-ink-soft mt-2">{progress}% da estrutura inicial preenchida</p>
        <div className="mt-6 space-y-1">
          {stages.map((stage, i) => <div key={stage} className={`text-sm px-3 py-2 rounded-card ${i === 0 ? "bg-teal-soft text-teal font-medium" : "text-ink-soft"}`}>{i + 1}. {stage}</div>)}
        </div>
      </aside>

      <div>
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-teal font-semibold">Etapa 1</p>
          <h2 className="font-display text-4xl mt-2">Transforme o tema em uma pergunta pesquisável.</h2>
          <p className="text-ink-soft mt-3 leading-relaxed">Este protótipo organiza as decisões metodológicas em blocos. As sugestões ajudam a estruturar o raciocínio, mas você continua responsável pela escolha científica final.</p>
        </div>

        <section className="mt-8 space-y-5">
          <Field label="Tema do trabalho" value={theme} setValue={setTheme} placeholder="Ex.: associação entre semaglutida e sintomas depressivos" />

          <div className="bg-white border border-line rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3"><label className="text-sm font-medium">Pergunta de pesquisa</label><button type="button" onClick={suggestQuestion} className="text-xs text-teal font-medium">Sugerir estrutura</button></div>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} className="w-full mt-3 border border-line rounded-card px-4 py-3 outline-none focus:border-teal" placeholder="Qual pergunta você quer responder?" />
            <p className="text-xs text-ink-soft mt-2">Depois podemos adaptar este bloco para PICO, PECO, SPIDER ou outra estrutura conforme o tipo de estudo.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white border border-line rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3"><label className="text-sm font-medium">Objetivo geral</label><button type="button" onClick={suggestObjective} className="text-xs text-teal font-medium">Sugerir</button></div>
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={5} className="w-full mt-3 border border-line rounded-card px-4 py-3 outline-none focus:border-teal" />
            </div>
            <div className="bg-white border border-line rounded-2xl p-6">
              <label className="text-sm font-medium">Desenho do estudo</label>
              <select value={studyType} onChange={(e) => setStudyType(e.target.value)} className="w-full mt-3 border border-line rounded-card px-4 py-3 bg-white outline-none focus:border-teal">
                {["Observacional transversal", "Coorte", "Caso-controle", "Ensaio clínico", "Revisão integrativa", "Revisão sistemática", "Relato de caso"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <div className="mt-4 bg-amber-soft border border-amber/20 rounded-card p-3 text-xs text-ink-soft">A escolha do desenho deve responder à pergunta e considerar viabilidade, ética e acesso aos dados.</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="População" value={population} setValue={setPopulation} placeholder="Ex.: adultos acompanhados em ambulatório" />
            <Field label="Desfecho principal" value={outcome} setValue={setOutcome} placeholder="Ex.: mudança no escore de sintomas depressivos" />
          </div>

          <div className="bg-ink text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div><p className="text-xs uppercase tracking-widest text-teal-soft">Resumo do protocolo</p><h3 className="font-display text-2xl mt-2">{theme || "Seu tema aparecerá aqui"}</h3><p className="text-white/70 text-sm mt-2">{question || "Preencha a pergunta para visualizar o núcleo científico do projeto."}</p>{saved && <p className="text-teal-soft text-xs mt-3">Rascunho salvo neste dispositivo.</p>}</div>
            <button onClick={saveDraft} className="bg-white text-ink px-5 py-3 rounded-card font-medium shrink-0">Salvar rascunho</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string }) {
  return <div className="bg-white border border-line rounded-2xl p-6"><label className="text-sm font-medium">{label}</label><input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full mt-3 border border-line rounded-card px-4 py-3 outline-none focus:border-teal" /></div>;
}
