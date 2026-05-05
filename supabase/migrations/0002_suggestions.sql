-- Sugestões de melhoria · formulário público em /sugestoes
-- Aplique via Supabase SQL Editor ou MCP. Idempotente.

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 4 and 4000),
  category text check (category in ('elogio', 'melhoria', 'erro', 'outro')),
  page text,
  author_name text,
  author_email text,
  user_id uuid references auth.users(id) on delete set null,
  user_agent text,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;

-- nenhuma policy para anon/auth — leitura/escrita só via service_role,
-- que ignora RLS. A API route /api/sugestoes faz a inserção server-side.

create index if not exists suggestions_created_idx on suggestions (created_at desc);
create index if not exists suggestions_category_idx on suggestions (category);
