-- ============================================================
-- Painel completo do Admin (item novo)
-- ============================================================
-- Rode depois de 14_bulk_import.sql.
--
-- O admin precisa enxergar tudo (projetos em qualquer status,
-- interesses manifestados, contagem de alunos/coordenadores) para o
-- painel institucional fazer sentido. As policies de leitura
-- existentes são propositalmente restritas (dono vê o próprio,
-- coordenador vê o departamento) — aqui adicionamos, sem remover
-- nada, uma visão ampla só para quem é dono da universidade.
--
-- Como cada instância representa UMA universidade só (modelo "um
-- ResearchHub por universidade"), "toda a universidade" aqui
-- equivale a "toda a instância".

create policy "Admin vê todos os projetos" on projects
  for select
  using (
    exists (
      select 1 from universities un
      where un.owner_user_id = (select id from users where auth_user_id = auth.uid())
    )
  );

create policy "Admin vê todos os interesses" on project_members
  for select
  using (
    exists (
      select 1 from universities un
      where un.owner_user_id = (select id from users where auth_user_id = auth.uid())
    )
  );

create policy "Admin vê todos os usuários" on users
  for select
  using (
    exists (
      select 1 from universities un
      join users admin_user on admin_user.id = un.owner_user_id
      where admin_user.auth_user_id = auth.uid()
    )
  );
