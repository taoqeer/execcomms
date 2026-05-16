import express from 'express';
import cors from 'cors';
import { Ollama } from 'ollama';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── LLM backend configuration ───────────────────────────────────────────────
const LLM_BACKEND     = process.env.LLM_BACKEND     || 'ollama';   // 'ollama' | 'vertex'
const OLLAMA_HOST     = process.env.OLLAMA_HOST     || 'http://localhost:11434';
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || 'gemma4:e4b';
const VERTEX_PROJECT  = process.env.VERTEX_PROJECT  || 'gemma4-workshop';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const VERTEX_MODEL    = process.env.VERTEX_MODEL    || 'gemini-2.0-flash-001';

const ollama = new Ollama({ host: OLLAMA_HOST });

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve built frontend in production ──────────────────────────────────────
const publicDir = join(__dirname, 'public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ── Mock data helpers ────────────────────────────────────────────────────────
function loadData(filename) {
  return JSON.parse(readFileSync(join(__dirname, 'data', filename), 'utf-8'));
}

const VALID_SCENARIOS = ['jfrog', 'auth'];
const VALID_STAGES    = ['investigating', 'resolving', 'resolved'];

function resolveFile(scenario, stage, type) {
  const s  = VALID_SCENARIOS.includes(scenario) ? scenario : 'jfrog';
  const st = VALID_STAGES.includes(stage) ? stage : 'investigating';
  return `${s}-${st}-${type}.json`;
}

// ── Data API routes ───────────────────────────────────────────────────────────
app.get('/api/teams-chat', (req, res) => {
  const { scenario = 'jfrog', stage = 'investigating' } = req.query;
  res.json(loadData(resolveFile(scenario, stage, 'teams-chat')));
});

app.get('/api/incident-ticket', (req, res) => {
  const { scenario = 'jfrog', stage = 'investigating' } = req.query;
  res.json(loadData(resolveFile(scenario, stage, 'incident')));
});

app.get('/api/monitoring-status', (req, res) => {
  const { scenario = 'jfrog', stage = 'investigating' } = req.query;
  res.json(loadData(resolveFile(scenario, stage, 'monitoring')));
});

// ── Prompts ───────────────────────────────────────────────────────────────────
function buildPrompts(teamsChat, incidentTicket, monitoringStatus) {
  const system = `You are an executive communications assistant for a technology company. Your job is to synthesize technical incident data into clear, concise executive communications.

RULES:
- Never hallucinate. Only use the provided context.
- Be factual, calm, and professional.
- Output ONLY valid JSON — no markdown, no code blocks, no extra text.
- JSON structure must be exactly: { "stage": string, "severity": string, "eta": string, "rca": string, "business_impact": string, "comm_draft": string }

FIELD DEFINITIONS:
- stage: classify the current incident state as exactly one of "investigating", "resolving", or "resolved"
    "investigating" = root cause is unknown, no ETA, team is still diagnosing
    "resolving"     = root cause is known, a fix is actively in progress, ETA is available
    "resolved"      = the incident has been fully fixed and all systems are back to normal
- severity: one of "P1", "P2", "P3" based on business impact
- eta: human-readable ETA string, or "Unknown" if not yet determined, or "Resolved" if closed
- rca: 1-2 sentence root cause summary written for executives (no technical jargon)
- business_impact: 1-2 sentence description of the impact on the business and customers
- comm_draft: a professional 3-4 paragraph executive communication ready to send`;

  const user = `Synthesize the following incident data into an executive communication.

=== MS TEAMS CHAT ===
${JSON.stringify(teamsChat, null, 2)}

=== SERVICENOW INCIDENT TICKET ===
${JSON.stringify(incidentTicket, null, 2)}

=== MONITORING STATUS (DYNATRACE) ===
${JSON.stringify(monitoringStatus, null, 2)}

Output ONLY valid JSON matching this exact structure:
{
  "stage": "investigating",
  "severity": "P1",
  "eta": "...",
  "rca": "...",
  "business_impact": "...",
  "comm_draft": "..."
}`;

  return { system, user };
}

// ── SSE helpers ───────────────────────────────────────────────────────────────
function sseToken(res, content)  { res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`); }
function sseThink(res, content)  { res.write(`data: ${JSON.stringify({ type: 'thinking', content })}\n\n`); }
function sseEvent(res, type)     { res.write(`data: ${JSON.stringify({ type })}\n\n`); }

// Handle <think>…</think> blocks that some models emit inline
function* splitThinkingChunks(content, inThinking) {
  let text = content;

  if (text.includes('<think>')) {
    const before = text.split('<think>')[0];
    if (before) yield { kind: inThinking ? 'think' : 'token', text: before };
    yield { kind: 'think_start', text: '' };
    text = text.split('<think>').slice(1).join('<think>');
    inThinking = true;
  }

  if (text.includes('</think>')) {
    const [thinkPart, ...rest] = text.split('</think>');
    if (thinkPart) yield { kind: 'think', text: thinkPart };
    yield { kind: 'think_end', text: '' };
    text = rest.join('</think>');
    inThinking = false;
  }

  if (text) yield { kind: inThinking ? 'think' : 'token', text };
  return inThinking;
}

// ── Ollama streaming ──────────────────────────────────────────────────────────
async function streamOllama(res, system, user) {
  const stream = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
    stream: true,
    options: { temperature: 0.1 },
    format: 'json',
  });

  let inThinking = false;

  for await (const chunk of stream) {
    const content = chunk.message?.content || '';
    if (!content) continue;

    for (const part of splitThinkingChunks(content, inThinking)) {
      if (part.kind === 'think_start') { sseEvent(res, 'thinking_start'); inThinking = true; }
      else if (part.kind === 'think_end')   { sseEvent(res, 'thinking_end');   inThinking = false; }
      else if (part.kind === 'think')   { sseThink(res, part.text); }
      else if (part.kind === 'token')   { sseToken(res, part.text); }
    }
  }
}

// ── Vertex AI streaming ───────────────────────────────────────────────────────
async function streamVertex(res, system, user) {
  const { VertexAI } = await import('@google-cloud/vertexai');

  const vertexAI = new VertexAI({ project: VERTEX_PROJECT, location: VERTEX_LOCATION });
  const model = vertexAI.getGenerativeModel({
    model: VERTEX_MODEL,
    generationConfig: { temperature: 0.1 },
    systemInstruction: { parts: [{ text: system }] },
  });

  const streamResult = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: user }] }],
  });

  for await (const chunk of streamResult.stream) {
    const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (content) sseToken(res, content);
  }
}

// ── /api/summarize ─────────────────────────────────────────────────────────────
app.post('/api/summarize', async (req, res) => {
  const { teamsChat, incidentTicket, monitoringStatus } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { system, user } = buildPrompts(teamsChat, incidentTicket, monitoringStatus);

  try {
    if (LLM_BACKEND === 'vertex') {
      await streamVertex(res, system, user);
    } else {
      await streamOllama(res, system, user);
    }
    sseEvent(res, 'done');
  } catch (err) {
    console.error(`[${LLM_BACKEND}] error:`, err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
  }
  res.end();
});

// ── SPA fallback (serve index.html for all non-API routes) ──────────────────
if (existsSync(publicDir)) {
  app.get('*', (_req, res) => res.sendFile(join(publicDir, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ExecComms [${LLM_BACKEND}] running on http://localhost:${PORT}`);
});
