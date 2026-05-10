// Smoke test do Modo Estruturar — chama Gemini 2.5 Flash diretamente com
// o system prompt, sem Supabase no caminho. Útil pra ensaiar a saída antes
// do palco. Uso:
//
//   node scripts/test-estruturar.mjs                  (caso default: perícias/WhatsApp)
//   node scripts/test-estruturar.mjs ubs              (caso UBS pediátrica)
//   node scripts/test-estruturar.mjs viesado          (caso solução-já-comprada — testa anti-viés)
//
// Lê GOOGLE_API_KEY do .env (parser inline, sem dependência).

import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ROOT = process.cwd();

function loadDotenv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

loadDotenv();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('✗ GOOGLE_API_KEY ausente. Coloca no .env ou exporta no shell.');
  process.exit(1);
}

const systemPrompt = fs.readFileSync(path.join(ROOT, 'src/prompts/jo-estruturar.md'), 'utf8');

const CASES = {
  pericia: {
    problema:
      'Evasão de 40% no agendamento de perícias médicas oficiais, gerando ociosidade médica.',
    hipotese:
      'O servidor não lê o e-mail a tempo. Notificá-lo pelo WhatsApp corporativo reduzirá o absenteísmo.',
    experimento:
      'Enviar aviso via WhatsApp para amostra de 100 servidores e comparar a taxa de evasão com grupo de controle do e-mail durante 30 dias.',
  },
  ubs: {
    problema:
      'Filas longas em UBS pediátrica do bairro Jardim Aurora, em João Pessoa: mães esperando 3-4h com criança febril.',
    hipotese:
      'A fila acumula porque a triagem é feita duas vezes (recepção e enfermagem) e os prontuários estão em papel.',
    experimento:
      'Piloto de 5 dias na UBS Jardim Aurora unificando triagem em um único atendimento e digitalizando prontuário com tablet, com cronometragem de 50 atendimentos. Sucesso: tempo médio cai de 3h para < 1h.',
  },
  viesado: {
    problema: 'Servidores não usam o sistema interno de gestão de tarefas.',
    hipotese:
      'Vamos comprar a licença do Asana corporativo porque a interface é melhor e todos os servidores vão adotar imediatamente.',
    experimento:
      'Comprar 200 licenças de Asana e fazer treinamento de 1 dia. Medir adoção em 6 meses.',
  },
};

const which = process.argv[2] || 'pericia';
const caso = CASES[which];
if (!caso) {
  console.error(`✗ Caso desconhecido: ${which}. Disponíveis: ${Object.keys(CASES).join(', ')}`);
  process.exit(1);
}

const userMessage = [
  '[ Contexto · Wizard Estruturar / Sprint ]',
  '',
  'Cenário pré-estruturado pelo gestor público nas três variáveis canônicas:',
  '',
  `Problema: ${caso.problema}`,
  `Hipótese: ${caso.hipotese}`,
  `Experimento: ${caso.experimento}`,
  '',
  '[ Pedido ]',
  'Redija um Blueprint de Sprint SEI-Ready, aplicando o Paradigma MINDS (foco no cidadão real)',
  'e a tríade do InovaGov (Fase 1: Entender · Fase 2: Explorar · Fase 3: Entregar).',
  'Inclua a Camada Normativa Tripartite (Base Estruturante / Norma Operacional / Lacuna)',
  'e o caveat obrigatório de validação jurídica. Linguagem formal de administração pública.',
  'Se a hipótese parecer "solução já comprada", aponte o viés de confirmação antes do plano.',
].join('\n');

console.log(`\n=== caso: ${which} ===`);
console.log(`Problema: ${caso.problema}`);
console.log(`Hipótese: ${caso.hipotese}`);
console.log(`Experimento: ${caso.experimento}`);
console.log('\n--- streaming ---\n');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: systemPrompt,
  // sem tools — Estruturar é knowledge-in-prompt, não precisa de grounding
});

const t0 = Date.now();
const chat = model.startChat({ history: [] });
const result = await chat.sendMessageStream(userMessage);

let chars = 0;
for await (const chunk of result.stream) {
  const t = chunk.text() ?? '';
  chars += t.length;
  process.stdout.write(t);
}

const dt = Date.now() - t0;
console.log(`\n\n--- done · ${chars} chars · ${dt}ms ---`);
