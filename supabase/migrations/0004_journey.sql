-- 0004 · Jornada do servidor + artifacts dos 6 verbos
-- Aplique via Supabase SQL Editor ou MCP. Idempotente.

-- ==========================================================
-- 1) Amplia mode_used pros 6 verbos
-- ==========================================================
-- 0001 aceitava ('decisao','possibilidades'); 0003 adicionou 'estruturar'.
-- Agora os 6 verbos canônicos da Alavanca + os 2 modos legados.
-- Atenção: 'manter' substitui 'provar' (renome de produto 2026-05-11).

alter table messages drop constraint if exists messages_mode_used_check;
alter table messages add constraint messages_mode_used_check
  check (mode_used in (
    'decisao','possibilidades',
    'mapear','estruturar','formalizar','construir','avaliar','manter'
  ));

-- ==========================================================
-- 2) journeys — uma ativa por user, lab_label opcional
-- ==========================================================

create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_label text,
  status text not null default 'active'
    check (status in ('active','archived')),
  current_verb text not null default 'mapear'
    check (current_verb in (
      'mapear','estruturar','formalizar','construir','avaliar','manter'
    )),
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- Garante no banco "1 jornada ativa por user". Partial unique:
-- só conta linhas com status='active'; arquivadas ficam livres.
create unique index if not exists journeys_one_active_per_user
  on journeys (user_id) where status = 'active';

create index if not exists journeys_user_status_idx
  on journeys (user_id, status);

alter table journeys enable row level security;

drop policy if exists "own_journeys" on journeys;
create policy "own_journeys" on journeys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==========================================================
-- 3) journey_artifacts — saída de cada wizard, versionada
-- ==========================================================
-- wizard_input / jo_output são JSONB opacos definidos pelo lado dos
-- prompts. Server-side não inspeciona conteúdo — só persiste e devolve
-- íntegros (normalização heurística vive em src/lib/journey/normalize.ts).
--
-- replaces_artifact_id: regerar cria um novo artifact apontando pro
-- anterior. Cadeia explícita, sem coluna 'version' nem update destrutivo.
-- conversation_id: link opcional pra conversa com a Jô que produziu / continua.

create table if not exists journey_artifacts (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  verb text not null check (verb in (
    'mapear','estruturar','formalizar','construir','avaliar','manter'
  )),
  wizard_input jsonb not null,
  jo_output jsonb not null,
  conversation_id uuid references conversations(id) on delete set null,
  replaces_artifact_id uuid references journey_artifacts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists journey_artifacts_journey_created_idx
  on journey_artifacts (journey_id, created_at desc);

alter table journey_artifacts enable row level security;

-- RLS por cascata: o usuário acessa o artifact se for dono da journey.
drop policy if exists "own_journey_artifacts" on journey_artifacts;
create policy "own_journey_artifacts" on journey_artifacts
  for all
  using (
    exists (
      select 1 from journeys j
      where j.id = journey_artifacts.journey_id
        and j.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from journeys j
      where j.id = journey_artifacts.journey_id
        and j.user_id = auth.uid()
    )
  );
