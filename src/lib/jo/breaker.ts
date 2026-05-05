const RESET_MS = 5 * 60 * 1000;
const THRESHOLD = 3;

const state = {
  failures: 0,
  windowStart: Date.now(),
};

function rollWindow() {
  if (Date.now() - state.windowStart > RESET_MS) {
    state.failures = 0;
    state.windowStart = Date.now();
  }
}

export const deepseekBreaker = {
  shouldShortCircuit(): boolean {
    rollWindow();
    return state.failures > THRESHOLD;
  },
  recordFailure(): void {
    rollWindow();
    state.failures += 1;
  },
  recordSuccess(): void {
    rollWindow();
    if (state.failures > 0) state.failures -= 1;
  },
  snapshot() {
    rollWindow();
    return { failures: state.failures, windowStart: state.windowStart };
  },
};
