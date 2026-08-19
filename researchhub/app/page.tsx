import SearchBar from "@/components/SearchBar";
import EntityCard from "@/components/EntityCard";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentAppUser, getCurrentStudent, getCurrentProfessor } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await supabaseServer();
  const appUser = await getCurrentAppUser();
  const student = await getCurrentStudent();
  const professor = appUser?.role === "professor" ? await getCurrentProfessor() : null;

  const { data: lines } = await supabase
    .from("research_lines")
    .select("id, name, keywords")
    .eq("active", true)
    .limit(8);

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { count: universityCount } = await supabase
    .from("universities")
    .select("id", { count: "exact", head: true });

  const needsSetup = appUser && (!universityCount || universityCount === 0);

  let interestLineIds: string[] = [];
  let recommendedProfessors: any[] = [];
  let recommendedProjects: any[] = [];

  if (student) {
    const { data: interests } = await supabase
      .from("interests")
      .select("research_line_id")
      .eq("student_id", student.id);

    interestLineIds = (interests ?? []).map((i) => i.research_line_id);

    if (interestLineIds.length > 0) {
      const [profRes, projRes] = await Promise.all([
        supabase
          .from("professor_research_lines")
          .select("professors(id, name, specialty, accepting_students)")
          .in("research_line_id", interestLineIds)
          .limit(6),
        supabase
          .from("projects")
          .select("id, title, summary, status, keywords")
          .in("research_line_id", interestLineIds)
          .limit(6),
      ]);

      recommendedProfessors = (profRes.data ?? []).map((j: any) => j.professors).filter(Boolean);
      recommendedProjects = projRes.data ?? [];
    }
  }

  return (
    <div>
      <section className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-teal font-medium mb-3">
          Research Infrastructure Platform
        </p>
        <h1 className="font-display text-4xl leading-tight text-ink">
          Sobre o que você gostaria de pesquisar?
        </h1>
        <p className="text-ink-soft mt-4 leading-relaxed">
          Não procure pelo nome de um professor. Comece pela sua curiosidade —
          o ResearchHub conecta você a professores, laboratórios e projetos
          em segundos.
        </p>
        <div className="mt-8">
          <SearchBar />
        </div>
      </section>

      {needsSetup && (
        <section className="mt-10 max-w-2xl border border-amber/30 bg-amber-soft rounded-card px-5 py-4">
          <p className="text-sm text-ink">
            Essa instância do ResearchHub ainda não foi configurada.{" "}
            <Link href="/configuracao" className="text-amber font-medium hover:underline">
              Configurar agora
            </Link>{" "}
            para cadastrar a universidade e virar administrador.
          </p>
        </section>
      )}

      {appUser?.role === "professor" && !professor && (
        <section className="mt-10 max-w-2xl border border-teal/30 bg-teal-soft rounded-card px-5 py-4">
          <p className="text-sm text-ink">
            Sua conta ainda não tem um perfil de professor vinculado.{" "}
            <Link href="/professores/vincular" className="text-teal font-medium hover:underline">
              Completar agora
            </Link>{" "}
            para aparecer nas buscas e cadastrar projetos.
          </p>
        </section>
      )}

      {student && interestLineIds.length === 0 && (
        <section className="mt-10 max-w-2xl border border-teal/30 bg-teal-soft rounded-card px-5 py-4">
          <p className="text-sm text-ink">
            Você ainda não escolheu suas áreas de interesse.{" "}
            <Link href="/onboarding" className="text-teal font-medium hover:underline">
              Escolher agora
            </Link>{" "}
            para receber recomendações personalizadas.
          </p>
        </section>
      )}

      {student && interestLineIds.length > 0 && (
        <>
          {recommendedProfessors.length > 0 && (
            <section className="mt-16">
              <h2 className="text-sm uppercase tracking-wide text-ink-soft font-medium mb-4">
                Professores para você
              </h2>
              {recommendedProfessors.map((p: any) => (
                <EntityCard
                  key={p.id}
                  href={`/professores/${p.id}`}
                  eyebrow="Professor"
                  title={p.name}
                  subtitle={p.specialty}
                  badge={p.accepting_students ? { label: "Aceita orientandos", tone: "teal" } : undefined}
                />
              ))}
            </section>
          )}

          {recommendedProjects.length > 0 && (
            <section className="mt-4">
              <h2 className="text-sm uppercase tracking-wide text-ink-soft font-medium mb-4">
                Projetos para você
              </h2>
              {recommendedProjects.map((p: any) => (
                <EntityCard
                  key={p.id}
                  href={`/projetos/${p.id}`}
                  eyebrow="Projeto"
                  title={p.title}
                  subtitle={p.summary}
                  tags={p.keywords}
                  badge={{ label: STATUS_LABELS[p.status] ?? p.status, tone: p.status === "recruiting" ? "amber" : "teal" }}
                />
              ))}
            </section>
          )}

          <p className="text-sm mt-2">
            <Link href="/onboarding" className="text-teal hover:underline">
              Ajustar meus interesses
            </Link>
          </p>
        </>
      )}

      <section className="mt-16">
        <h2 className="text-sm uppercase tracking-wide text-ink-soft font-medium mb-4">
          Departamentos
        </h2>
        <div className="flex flex-wrap gap-2">
          {(departments ?? []).map((dept) => (
            <Link
              key={dept.id}
              href={`/departamentos/${dept.id}`}
              className="text-sm px-3 py-1.5 rounded-full border border-line bg-white hover:border-teal hover:text-teal transition-colors text-ink-soft"
            >
              {dept.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-wide text-ink-soft font-medium mb-4">
          Linhas de pesquisa ativas
        </h2>
        <div className="flex flex-wrap gap-2">
          {(lines ?? []).map((line) => (
            <Link
              key={line.id}
              href={`/linhas/${line.id}`}
              className="text-sm px-3 py-1.5 rounded-full border border-line bg-white hover:border-teal hover:text-teal transition-colors text-ink-soft"
            >
              {line.name}
            </Link>
          ))}
          {(!lines || lines.length === 0) && (
            <p className="text-sm text-ink-soft/70">
              Nenhuma linha de pesquisa cadastrada ainda. Rode <code className="font-mono">supabase/seed.sql</code> para popular dados de exemplo.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
