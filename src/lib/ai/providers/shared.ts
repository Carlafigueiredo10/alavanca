export function isRetriable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  if (msg.includes('abort')) return false;
  if (msg.includes('401') || msg.includes('403')) return false;
  if (msg.includes('content') && msg.includes('polic')) return false;
  return true;
}

export function timeoutController(ms: number, parent?: AbortSignal): AbortController {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), ms);
  if (parent) {
    if (parent.aborted) ctrl.abort();
    else parent.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  ctrl.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return ctrl;
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
