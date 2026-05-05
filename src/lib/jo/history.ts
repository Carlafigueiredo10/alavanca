export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_CHARS = 12_000;

export function truncateByChars(messages: ChatMessage[], maxChars: number = MAX_CHARS): ChatMessage[] {
  let total = messages.reduce((acc, m) => acc + m.content.length, 0);
  if (total <= maxChars) return messages;

  const trimmed = [...messages];
  while (trimmed.length > 1 && total > maxChars) {
    const dropped = trimmed.shift();
    if (!dropped) break;
    total -= dropped.content.length;
  }
  return trimmed;
}
