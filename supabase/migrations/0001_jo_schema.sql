-- Jô · schema inicial
-- Aplique via Supabase SQL Editor ou MCP. Idempotente.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  mode_used text check (mode_used in ('decisao', 'possibilidades')),
  is_partial boolean default false,
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "own_conversations" on conversations;
create policy "own_conversations" on conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own_messages" on messages;
create policy "own_messages" on messages
  for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);
create index if not exists conversations_user_idx on conversations (user_id, created_at desc);
