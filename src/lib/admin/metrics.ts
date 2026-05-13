import { createSupabaseAdminClient } from '../supabase/server';
import { OWNER_EMAIL } from './owner';

// Agregadores do painel /meus-produtos. Tudo SSR, service-role (ignora RLS),
// rodando em paralelo no frontmatter da página. Volumes hoje são pequenos
// (dezenas de linhas), então agregamos em JS depois de SELECT — sem GROUP BY
// nativo no supabase-js. Quando crescer, migrar pra RPC/views.

type Verb = 'mapear' | 'estruturar' | 'formalizar' | 'construir' | 'avaliar' | 'manter';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ZERO_CATEGORY = { elogio: 0, melhoria: 0, erro: 0, outro: 0, nenhuma: 0 } as const;
const ZERO_VERBS: Record<Verb, number> = {
  mapear: 0, estruturar: 0, formalizar: 0, construir: 0, avaliar: 0, manter: 0,
};

export interface SuggestionsMetrics {
  total: number;
  last30d: number;
  byCategory: { elogio: number; melhoria: number; erro: number; outro: number; nenhuma: number };
  byKind: {
    geral: number;
    bibliografia: number;
    ecossistema: { total: number; rede: number; pratica: number; ferramenta: number };
  };
  ultimaIso: string | null;
}

export interface UsersMetrics {
  total: number;
  comLogin: number;
  novos30d: number;
  ultimoLoginOutroIso: string | null;
}

export interface JourneyMetrics {
  jornadasAbertas: number;
  jornadasComLabel: number;
  jornadasArchived: number;
  pecasGeradas: number;
  pecasPorVerbo: Record<Verb, number>;
  topLabs: { lab: string; pecas: number }[];
}

export interface SnapshotsMetrics {
  count: number;
  desdeIso: string | null;
}

export async function getSuggestionsMetrics(): Promise<SuggestionsMetrics> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('suggestions')
    .select('category, kind, subkind, created_at')
    .order('created_at', { ascending: false });

  const empty: SuggestionsMetrics = {
    total: 0,
    last30d: 0,
    byCategory: { ...ZERO_CATEGORY },
    byKind: {
      geral: 0, bibliografia: 0,
      ecossistema: { total: 0, rede: 0, pratica: 0, ferramenta: 0 },
    },
    ultimaIso: null,
  };
  if (error || !data) {
    if (error) console.error('[metrics] suggestions falhou', error.message);
    return empty;
  }

  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const result: SuggestionsMetrics = {
    ...empty,
    byCategory: { ...ZERO_CATEGORY },
    byKind: {
      geral: 0, bibliografia: 0,
      ecossistema: { total: 0, rede: 0, pratica: 0, ferramenta: 0 },
    },
  };
  result.total = data.length;
  result.ultimaIso = data[0]?.created_at ?? null;

  for (const row of data) {
    const cat = (row.category as string | null) ?? 'nenhuma';
    if (cat in result.byCategory) {
      result.byCategory[cat as keyof typeof ZERO_CATEGORY]++;
    } else {
      result.byCategory.nenhuma++;
    }

    const kind = row.kind as string;
    if (kind === 'geral') result.byKind.geral++;
    else if (kind === 'bibliografia') result.byKind.bibliografia++;
    else if (kind === 'ecossistema') {
      result.byKind.ecossistema.total++;
      const sk = row.subkind as 'rede' | 'pratica' | 'ferramenta' | null;
      if (sk === 'rede' || sk === 'pratica' || sk === 'ferramenta') {
        result.byKind.ecossistema[sk]++;
      }
    }

    if (row.created_at && new Date(row.created_at).getTime() >= cutoff) {
      result.last30d++;
    }
  }

  return result;
}

export async function getUsersMetrics(): Promise<UsersMetrics> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const empty: UsersMetrics = { total: 0, comLogin: 0, novos30d: 0, ultimoLoginOutroIso: null };
  if (error || !data?.users) {
    if (error) console.error('[metrics] users falhou', error.message);
    return empty;
  }

  const cutoff = Date.now() - THIRTY_DAYS_MS;
  let comLogin = 0;
  let novos30d = 0;
  let ultimoLoginOutroTs = 0;
  let ultimoLoginOutroIso: string | null = null;
  const ownerLower = OWNER_EMAIL.toLowerCase();

  for (const u of data.users) {
    if (u.last_sign_in_at) comLogin++;
    if (u.created_at && new Date(u.created_at).getTime() >= cutoff) novos30d++;

    const email = (u.email ?? '').toLowerCase();
    if (email !== ownerLower && u.last_sign_in_at) {
      const ts = new Date(u.last_sign_in_at).getTime();
      if (ts > ultimoLoginOutroTs) {
        ultimoLoginOutroTs = ts;
        ultimoLoginOutroIso = u.last_sign_in_at;
      }
    }
  }

  return { total: data.users.length, comLogin, novos30d, ultimoLoginOutroIso };
}

export async function getJourneyMetrics(): Promise<JourneyMetrics> {
  const admin = createSupabaseAdminClient();
  const [journeysRes, artifactsRes] = await Promise.all([
    admin.from('journeys').select('id, lab_label, status'),
    admin.from('journey_artifacts').select('verb, journey_id'),
  ]);

  if (journeysRes.error) console.error('[metrics] journeys falhou', journeysRes.error.message);
  if (artifactsRes.error) console.error('[metrics] journey_artifacts falhou', artifactsRes.error.message);

  const journeys = journeysRes.data ?? [];
  const artifacts = artifactsRes.data ?? [];

  let jornadasAbertas = 0;
  let jornadasComLabel = 0;
  let jornadasArchived = 0;
  const labelById = new Map<string, string | null>();

  for (const j of journeys) {
    if (j.status === 'archived') jornadasArchived++;
    else jornadasAbertas++;
    if (j.lab_label && j.lab_label.trim().length > 0) jornadasComLabel++;
    labelById.set(j.id as string, (j.lab_label as string | null) ?? null);
  }

  const pecasPorVerbo: Record<Verb, number> = { ...ZERO_VERBS };
  const pecasPorJornada: Record<string, number> = {};

  for (const a of artifacts) {
    const v = a.verb as Verb;
    if (v in pecasPorVerbo) pecasPorVerbo[v]++;
    const jid = a.journey_id as string;
    pecasPorJornada[jid] = (pecasPorJornada[jid] ?? 0) + 1;
  }

  const topLabs = Object.entries(pecasPorJornada)
    .map(([jid, count]) => ({
      lab: labelById.get(jid)?.trim() || '(sem nome)',
      pecas: count,
    }))
    .sort((a, b) => b.pecas - a.pecas)
    .slice(0, 5);

  return {
    jornadasAbertas,
    jornadasComLabel,
    jornadasArchived,
    pecasGeradas: artifacts.length,
    pecasPorVerbo,
    topLabs,
  };
}

// Indicador de saúde do cron: quantos snapshots existem e desde quando.
// Se contar parar de crescer dia-a-dia, pg_cron travou. Sem isso, premiação
// fica cega — então monitorar discretamente é melhor do que ignorar.
export async function getSnapshotsMetrics(): Promise<SnapshotsMetrics> {
  const admin = createSupabaseAdminClient();
  const [countRes, firstRes] = await Promise.all([
    admin.from('platform_metrics_snapshots').select('id', { count: 'exact', head: true }),
    admin
      .from('platform_metrics_snapshots')
      .select('captured_at')
      .order('captured_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (countRes.error) console.error('[metrics] snapshots count falhou', countRes.error.message);
  if (firstRes.error) console.error('[metrics] snapshots first falhou', firstRes.error.message);

  return {
    count: countRes.count ?? 0,
    desdeIso: firstRes.data?.captured_at ?? null,
  };
}
