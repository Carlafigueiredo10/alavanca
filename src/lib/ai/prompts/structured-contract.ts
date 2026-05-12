// Contrato JSON injetado server-side quando o cliente do verbo é
// (a) autenticado e (b) o verbo está em STRUCTURED_MODES. Mantém o
// jo-<verbo>.md focado em diagnóstico/conteúdo, sem condicionais "se
// logado/anônimo" — o LLM não conhece o estado de sessão.
//
// Camada 3 (Carla, 2026-05-12):
//  - Hooks hardcoded a partir de ALL_HOOK_IDS (fonte: hooks.ts) pra
//    eliminar alucinação de chaves inexistentes.
//  - Trava lógica: NO_GO ⇒ route_order = [].
//  - `markdown` POR ÚLTIMO (ordem importa pro streaming-parser extrair
//    cabeçalho cedo).

import { ALL_HOOK_IDS } from '../../diagnostico/hooks';
import type { JoMode } from './index';

const VALID_VERBS = ['estruturar', 'formalizar', 'construir', 'avaliar', 'manter'];

function mapearContract(hookIds: readonly string[]): string {
  const hookList = hookIds.map((id) => `   - "${id}"`).join('\n');
  const verbList = VALID_VERBS.map((v) => `"${v}"`).join(', ');

  return [
    '---',
    '',
    '# CONTRATO DE SAÍDA — JSON ESTRITO',
    '',
    'Sua resposta DEVE ser exclusivamente um objeto JSON válido. Sem texto antes',
    'ou depois. Sem blocos de código \\`\\`\\`json\\`\\`\\`. O sistema parseia e',
    'renderiza a saída — qualquer ruído quebra a UI.',
    '',
    'Dois formatos possíveis — escolha um conforme o input do servidor.',
    '',
    '## Formato 1 — Devolução técnica (input insuficiente)',
    '',
    'Use quando o cenário descrito carecer de matéria-prima institucional:',
    'atores não nominados, processo vago, gargalo genérico, risco não',
    'quantificado. NÃO tente adivinhar — devolva checklist pedindo refinamento.',
    '',
    '{',
    '  "type": "devolucao",',
    '  "checklist": [',
    '    { "ok": true,  "label": "Processo concreto",            "hint": null },',
    '    { "ok": false, "label": "Atores nominados",             "hint": "Cite nome+cargo do patrocinador" },',
    '    { "ok": false, "label": "Gargalo técnico identificado", "hint": "Aponte o ponto específico de atrito" },',
    '    { "ok": true,  "label": "Risco quantificado",           "hint": null }',
    '  ],',
    '  "next": "Refine os 2 campos marcados e regere — o wizard segue aberto.",',
    '  "message": "Frase curta de contexto antes do checklist (opcional)."',
    '}',
    '',
    '## Formato 2 — Relatório válido (input concreto o bastante)',
    '',
    'CAMPOS NESTA ORDEM EXATA — `markdown` SEMPRE POR ÚLTIMO:',
    '',
    '{',
    '  "type": "relatorio",',
    '  "goNoGo": "GO" | "GO_MITIGATION" | "NO_GO",',
    '  "route_order": [...],',
    '  "diagnostic_tags": [...],',
    '  "summary": "Resumo de até 200 caracteres",',
    '  "markdown": "## Relatório de Diagnóstico Institucional\\n\\n..."',
    '}',
    '',
    '### Regras estritas',
    '',
    '**1. goNoGo** — literais exatos (case-sensitive):',
    '   - "GO": cenário viável, segue pra próximos verbos.',
    '   - "GO_MITIGATION": viável com ressalvas (a serem detalhadas no markdown).',
    '   - "NO_GO": cenário inviável — o processo morre aqui.',
    '',
    `**2. route_order** — array com 0 a 5 verbos da sequência recomendada.`,
    `   Verbos válidos: ${verbList}.`,
    '   **TRAVA LÓGICA OBRIGATÓRIA**: se goNoGo = "NO_GO", route_order DEVE',
    '   ser exatamente [] (array vazio). O frontend bloqueia navegação a',
    '   partir dessa lista — preencher contradiz o NO_GO.',
    '',
    '**3. diagnostic_tags** — array de 0 a 5 chaves. ESCOLHA EXCLUSIVAMENTE',
    '   desta lista fechada (formato "dimensão:resposta"). É PROIBIDO',
    '   inventar chaves novas, variantes, traduções ou abreviações.',
    '   Quando o cenário está completo e materializado mas nenhuma chave',
    '   exata se aplica, devolva o relatório normalmente com',
    '   diagnostic_tags: []. O "type": "devolucao" é estritamente',
    '   reservado pra inputs vagos ou sem materialidade institucional',
    '   (atores não nominados, processo genérico, gargalo não específico,',
    '   risco não quantificado) — NÃO use devolucao só por ausência de',
    '   tag aplicável.',
    '',
    hookList,
    '',
    '**4. summary** — string de até 200 caracteres. Alimenta [CONTEXTO_PRÉVIO]',
    '   dos próximos verbos — seja denso e específico, sem adjetivos vazios.',
    '',
    '**5. markdown** — última chave do objeto. Pode usar headers (##, ###),',
    '   negrito (**), itálico (*), listas. Pode ser longo — o frontend renderiza',
    '   incrementalmente. Não envolva em \\`\\`\\`code fences\\`\\`\\`.',
    '',
  ].join('\n');
}

export function buildStructuredContractSuffix(mode: JoMode): string | null {
  if (mode === 'mapear') return mapearContract(ALL_HOOK_IDS);
  // Outros verbos ainda não têm contrato estruturado — Carla adiciona aqui
  // quando atualizar os prompts.
  return null;
}
