-- 0003 · Modo Estruturar + Rate Limit
-- Aplique via Supabase SQL Editor ou MCP. Idempotente.

-- ==========================================================
-- 1) Permitir mode_used = 'estruturar' nas messages
-- ==========================================================
-- O check original em 0001 só aceitava ('decisao','possibilidades').
-- Sem este alter, inserts no Modo Estruturar quebram a request.

alter table messages drop constraint if exists messages_mode_used_check;
alter table messages add constraint messages_mode_used_check
  check (mode_used in ('decisao', 'possibilidades', 'estruturar'));

-- ==========================================================
-- 2) Tabela de rate-log para o /api/jo/chat
-- ==========================================================
-- Um registro por chamada bem-sucedida. Lookup é por (user_id, created_at).
-- Mantemos só uma janela curta no banco — pruning agendado fica como
-- backlog (cron + delete where created_at < now() - interval '7 days').

create table if not exists chat_rate_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists chat_rate_log_user_ts_idx
  on chat_rate_log (user_id, created_at desc);

alter table chat_rate_log enable row level security;

-- Usuário só lê e insere sobre o próprio user_id. Sem update/delete via RLS
-- — limpeza é tarefa administrativa (service role).
drop policy if exists "rate_log_select_own" on chat_rate_log;
create policy "rate_log_select_own" on chat_rate_log
  for select
  using (auth.uid() = user_id);

drop policy if exists "rate_log_insert_own" on chat_rate_log;
create policy "rate_log_insert_own" on chat_rate_log
  for insert
  with check (auth.uid() = user_id);
