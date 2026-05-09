export type Provider = 'gemini' | 'deepseek' | 'none';

export interface LogEvent {
  request_id: string;
  route: string;
  user_id?: string;
  provider?: Provider;
  mode?: 'decisao' | 'possibilidades';
  duration_ms?: number;
  error?: string;
  is_partial?: boolean;
  event?: string;
}

export function logEvent(e: LogEvent): void {
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...e }));
  } catch {
    console.log('[log-fallback]', e.route, e.event ?? '', e.error ?? '');
  }
}

export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'unknown_error';
  }
}
