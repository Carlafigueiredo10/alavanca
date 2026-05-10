import type { SupabaseServerClient } from './auth';

export interface RateLimitOk {
  ok: true;
}
export interface RateLimitBlocked {
  ok: false;
  window: 'minute' | 'day';
  message: string;
}
export type RateLimitResult = RateLimitOk | RateLimitBlocked;

export interface RateLimitConfig {
  perMinute: number;
  perDay: number;
}

export const DEFAULT_CHAT_RATE_LIMIT: RateLimitConfig = {
  perMinute: 10,
  perDay: 100,
};

/**
 * Conta uso recente do usuário em uma única query (últimas 24h),
 * filtra a janela de 1min localmente e bloqueia se exceder.
 *
 * Fail-open: se o select da tabela falhar, deixa passar e loga —
 * não queremos derrubar usuário legítimo por defeito interno.
 */
export async function checkChatRateLimit(
  supabase: SupabaseServerClient,
  userId: string,
  cfg: RateLimitConfig = DEFAULT_CHAT_RATE_LIMIT
): Promise<RateLimitResult> {
  const now = Date.now();
  const oneDayAgoIso = new Date(now - 86_400_000).toISOString();
  const oneMinAgoMs = now - 60_000;

  const { data, error } = await supabase
    .from('chat_rate_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', oneDayAgoIso)
    .order('created_at', { ascending: false });

  if (error) {
    return { ok: true }; // fail-open
  }

  const dayCount = data?.length ?? 0;
  if (dayCount >= cfg.perDay) {
    return {
      ok: false,
      window: 'day',
      message:
        'Você atingiu o limite diário de mensagens com a Jô. Tente novamente amanhã ou nos avise se precisa de mais.',
    };
  }

  let minCount = 0;
  for (const row of data ?? []) {
    const ts = new Date(row.created_at as string).getTime();
    if (ts >= oneMinAgoMs) minCount++;
  }
  if (minCount >= cfg.perMinute) {
    return {
      ok: false,
      window: 'minute',
      message:
        'Você fez muitas requisições nos últimos minutos. Aguarde um instante e tente de novo.',
    };
  }

  return { ok: true };
}

/**
 * Registra uso do usuário. Fail-silent: se inserir falhar, não bloqueia
 * a request — só perde a capacidade de rate-limit naquela janela.
 */
export async function logChatRateUse(
  supabase: SupabaseServerClient,
  userId: string
): Promise<void> {
  await supabase.from('chat_rate_log').insert({ user_id: userId });
}
