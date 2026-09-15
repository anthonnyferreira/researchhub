import Link from "next/link";

const steps = [
  ["01", "Descubra", "Parta de uma ideia ou peça sugestões de temas clínicos e acadêmicos."],
  ["02", "Valide", "Consulte PubMed e Crossref e veja volume, recência e tendência da literatura."],
  ["03", "Estruture", "Transforme o tema em pergunta, objetivos, hipótese e desenho de estudo."],
  ["04", "Construa", "Organize metodologia, referências e etapas até chegar ao manuscrito."],
];

export default function HomePage() {
  return (
    <div>
      <section className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center py-8 lg:py-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-medium text-teal">
            Para estudantes de medicina e residentes
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.03] tracking-tight text-ink mt-6 max-w-3xl">
            Da primeira ideia ao seu trabalho científico.
          </h1>
          <p className="text-lg text-ink-soft mt-6 leading-relaxed max-w-2xl">
            Explore temas, teste a força da literatura científica e organize seu projeto com um fluxo guiado. Sem começar pela página em branco.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/descobrir" className="bg-teal text-white px-6 py-3 rounded-card text-center font-medium hover:bg-teal/90 transition-colors">
              Tenho um tema
            </Link>
            <Link href="/ideias" className="border border-line bg-white text-ink px-6 py-3 rounded-card text-center font-medium hover:border-teal transition-colors">
              Quero encontrar um tema
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-soft/70">Protótipo clínico-acadêmico. As análises apoiam a decisão, não substituem orientação metodológica.</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-teal font-semibold">Radar científico</p>
          <h2 className="font-display text-2xl mt-2">Semaglutida e sintomas depressivos</h2>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-card bg-paper border border-line p-4"><p className="text-2xl font-semibold">1.248</p><p className="text-xs text-ink-soft mt-1">resultados no PubMed</p></div>
            <div className="rounded-card bg-paper border border-line p-4"><p className="text-2xl font-semibold">563</p><p className="text-xs text-ink-soft mt-1">publicações recentes</p></div>
            <div className="rounded-card bg-teal-soft border border-teal/20 p-4"><p className="text-sm font-semibold text-teal">Tema em crescimento</p><p className="text-xs text-ink-soft mt-1">atividade recente elevada</p></div>
            <div className="rounded-card bg-amber-soft border border-amber/20 p-4"><p className="text-sm font-semibold text-amber">Recorte recomendado</p><p className="text-xs text-ink-soft mt-1">tema ainda amplo</p></div>
          </div>
          <div className="mt-5 pt-5 border-t border-line text-sm text-ink-soft">
            O sistema não declara “lacuna científica” apenas por baixa contagem. Ele sinaliza oportunidades para investigação.
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-line">
        <p className="text-xs uppercase tracking-widest text-teal font-semibold">Um fluxo, não um chatbot vazio</p>
        <h2 className="font-display text-3xl mt-3">Pesquisa científica em etapas claras.</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          {steps.map(([n, title, text]) => (
            <div key={n} className="border border-line bg-white rounded-card p-5">
              <span className="font-mono text-xs text-teal">{n}</span>
              <h3 className="font-display text-xl mt-4">{title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="my-12 rounded-2xl bg-ink text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-teal-soft text-xs uppercase tracking-widest">ResearchHub Scholar</p>
          <h2 className="font-display text-3xl mt-2">Teste uma pergunta científica real.</h2>
          <p className="text-white/70 mt-2 max-w-xl">Digite um tema e veja o panorama da literatura em bases científicas antes de decidir seu recorte.</p>
        </div>
        <Link href="/descobrir" className="shrink-0 bg-white text-ink px-6 py-3 rounded-card font-medium text-center">Abrir radar científico</Link>
      </section>
    </div>
  );
}
