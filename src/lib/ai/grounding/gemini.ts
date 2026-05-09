export interface GroundingSource {
  uri: string;
  title?: string;
}

export function collectSources(metadata: any, into: GroundingSource[]) {
  const chunks = metadata?.groundingChunks;
  if (!Array.isArray(chunks)) return;
  for (const c of chunks) {
    const uri = c?.web?.uri;
    if (!uri) continue;
    if (into.find((s) => s.uri === uri)) continue;
    into.push({ uri, title: c.web.title });
  }
}

export function formatSourcesFooter(sources: GroundingSource[]): string {
  if (sources.length === 0) return '';
  const lines = sources.map(
    (s, i) => `${i + 1}. [${(s.title || s.uri).replace(/[\[\]]/g, '')}](${s.uri})`
  );
  return `\n\n---\n\n**Fontes** (busca web)\n\n${lines.join('\n')}\n`;
}
