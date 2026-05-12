import type { SupabaseServerClient } from '../server/auth';

export type Verb =
  | 'mapear'
  | 'estruturar'
  | 'formalizar'
  | 'construir'
  | 'avaliar'
  | 'manter';

export type JourneyStatus = 'active' | 'archived';

export interface Journey {
  id: string;
  user_id: string;
  lab_label: string | null;
  status: JourneyStatus;
  current_verb: Verb;
  started_at: string;
  last_active_at: string;
}

export interface JourneyArtifact {
  id: string;
  journey_id: string;
  verb: Verb;
  wizard_input: unknown;
  jo_output: unknown;
  conversation_id: string | null;
  replaces_artifact_id: string | null;
  created_at: string;
}

export interface AppendArtifactInput {
  verb: Verb;
  wizardInput: unknown;
  joOutput: unknown;
  conversationId?: string | null;
  replacesArtifactId?: string | null;
}

export interface JourneyContext {
  journey: Pick<Journey, 'id' | 'lab_label' | 'current_verb' | 'status'>;
  artifacts: JourneyArtifact[];
}

export type GetJourneyResult =
  | { ok: true; journey: Journey }
  | { ok: false; error: string };

export type AppendArtifactResult =
  | { ok: true; artifact: JourneyArtifact }
  | { ok: false; error: string };

export type GetJourneyContextResult =
  | { ok: true; context: JourneyContext }
  | { ok: false; error: string };

export type MutationResult =
  | { ok: true }
  | { ok: false; error: string };

// Resolve a jornada ativa do user; cria se não houver.
// Partial unique index `journeys_one_active_per_user` garante invariante no
// banco; race de 2 inserts simultâneos é tratado pelo bd (segundo falha com
// 23505 e a gente refaz o select).
export async function getOrCreateActiveJourney(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<GetJourneyResult> {
  const existing = await selectActiveJourney(supabase, userId);
  if (!existing.ok) return existing;
  if (existing.journey) return { ok: true, journey: existing.journey };

  const { data, error } = await supabase
    .from('journeys')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (error) {
    // 23505 = unique_violation: outro request criou a jornada entre o select e
    // o insert. Refaz o select; agora deve existir.
    if (error.code === '23505') {
      const retry = await selectActiveJourney(supabase, userId);
      if (retry.ok && retry.journey) return { ok: true, journey: retry.journey };
    }
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'insert returned no row' };
  return { ok: true, journey: data as Journey };
}

async function selectActiveJourney(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ ok: true; journey: Journey | null } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, journey: (data as Journey | null) ?? null };
}

export async function appendArtifact(
  supabase: SupabaseServerClient,
  journeyId: string,
  input: AppendArtifactInput,
): Promise<AppendArtifactResult> {
  const { data, error } = await supabase
    .from('journey_artifacts')
    .insert({
      journey_id: journeyId,
      verb: input.verb,
      wizard_input: input.wizardInput,
      jo_output: input.joOutput,
      conversation_id: input.conversationId ?? null,
      replaces_artifact_id: input.replacesArtifactId ?? null,
    })
    .select('*')
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert returned no row' };

  // Best-effort: avança current_verb e last_active_at. Falha aqui não
  // invalida o artifact recém-criado.
  await supabase
    .from('journeys')
    .update({ current_verb: input.verb, last_active_at: new Date().toISOString() })
    .eq('id', journeyId);

  return { ok: true, artifact: data as JourneyArtifact };
}

// Últimos N artifacts (DESC por created_at) + metadados da jornada.
// O cap em N vive em normalize.ts (MAX_CONTEXT_ARTIFACTS).
export async function getJourneyContext(
  supabase: SupabaseServerClient,
  journeyId: string,
  limit: number,
): Promise<GetJourneyContextResult> {
  const { data: journey, error: jErr } = await supabase
    .from('journeys')
    .select('id, lab_label, current_verb, status')
    .eq('id', journeyId)
    .single();

  if (jErr) return { ok: false, error: jErr.message };
  if (!journey) return { ok: false, error: 'journey not found' };

  const { data: artifacts, error: aErr } = await supabase
    .from('journey_artifacts')
    .select('*')
    .eq('journey_id', journeyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (aErr) return { ok: false, error: aErr.message };

  return {
    ok: true,
    context: {
      journey: journey as JourneyContext['journey'],
      artifacts: (artifacts ?? []) as JourneyArtifact[],
    },
  };
}

export async function archiveJourney(
  supabase: SupabaseServerClient,
  journeyId: string,
): Promise<MutationResult> {
  const { error } = await supabase
    .from('journeys')
    .update({ status: 'archived' })
    .eq('id', journeyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setLabLabel(
  supabase: SupabaseServerClient,
  journeyId: string,
  labLabel: string | null,
): Promise<MutationResult> {
  const { error } = await supabase
    .from('journeys')
    .update({ lab_label: labLabel })
    .eq('id', journeyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
