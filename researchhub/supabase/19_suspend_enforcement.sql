-- ============================================================
-- P0 — Suspensão real de conta
-- ============================================================
-- Rode depois de 18_user_management.sql.
--
-- Até aqui, "Suspender" em /admin/usuarios só mudava um valor no
-- banco — não impedia nada de verdade. Isso corrige a parte que
-- importa: usa policies RESTRICTIVE, que o Postgres exige em CIMA de
-- qualquer policy permissiva já existente (as 18 anteriores continuam
-- intocadas — RESTRICTIVE só ADICIONA uma trava obrigatória, nunca
-- abre acesso novo). Isso é deliberado: reescrever as policies
-- existentes para embutir essa checagem seria um retrabalho grande e
-- arriscado; RESTRICTIVE resolve com risco de regressão mínimo.

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select status = 'active' from users where auth_user_id = auth.uid()),
    -- Se ainda não existe linha em `users` (ex.: no instante entre o
    -- signup e a auto-criação em getCurrentAppUser), não bloqueia —
    -- ninguém pode estar "suspenso" antes de ter perfil.
    true
  );
$$;

-- Perfil de professor, linha de pesquisa, laboratório
create policy "Bloqueia escrita de suspenso (professors insert)" on professors
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (professors update)" on professors
  as restrictive for update using (public.is_active_user());

create policy "Bloqueia escrita de suspenso (research_lines insert)" on research_lines
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (research_lines update)" on research_lines
  as restrictive for update using (public.is_active_user());

create policy "Bloqueia escrita de suspenso (laboratories insert)" on laboratories
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (laboratories update)" on laboratories
  as restrictive for update using (public.is_active_user());

-- Projetos e interesse
create policy "Bloqueia escrita de suspenso (projects insert)" on projects
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (projects update)" on projects
  as restrictive for update using (public.is_active_user());

create policy "Bloqueia escrita de suspenso (project_members insert)" on project_members
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (project_members delete)" on project_members
  as restrictive for delete using (public.is_active_user());

-- Publicações
create policy "Bloqueia escrita de suspenso (publications insert)" on publications
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (publications update)" on publications
  as restrictive for update using (public.is_active_user());

create policy "Bloqueia escrita de suspenso (publication_authors insert)" on publication_authors
  as restrictive for insert with check (public.is_active_user());

create policy "Bloqueia escrita de suspenso (publication_projects insert)" on publication_projects
  as restrictive for insert with check (public.is_active_user());

-- Interesses do aluno e favoritos
create policy "Bloqueia escrita de suspenso (interests insert)" on interests
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (interests delete)" on interests
  as restrictive for delete using (public.is_active_user());

create policy "Bloqueia escrita de suspenso (saved_items insert)" on saved_items
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (saved_items delete)" on saved_items
  as restrictive for delete using (public.is_active_user());

-- Perfil de aluno
create policy "Bloqueia escrita de suspenso (students insert)" on students
  as restrictive for insert with check (public.is_active_user());
create policy "Bloqueia escrita de suspenso (students update)" on students
  as restrictive for update using (public.is_active_user());

-- Edição do próprio registro em `users` (nome, e-mail, etc.) — não
-- inclui INSERT de propósito: é essa mesma tabela que confirma se a
-- pessoa está suspensa, e o INSERT inicial (auto-criação) precisa
-- continuar funcionando mesmo antes de a linha existir (coberto pelo
-- `coalesce(..., true)` da função acima de qualquer forma, mas
-- deixamos o INSERT fora daqui por clareza).
create policy "Bloqueia escrita de suspenso (users update)" on users
  as restrictive for update using (public.is_active_user());
