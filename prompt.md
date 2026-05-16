Build a full-stack localhost web app called ExecComms — an executive incident summarizer POC for a hackathon.

CONCEPT:
"Timmy", a product owner, needs a single dashboard that reads his team's MS Teams chat (mocked JSON) and a live ServiceNow incident ticket (mocked JSON), then uses a local LLM to compile an accurate executive COMM with ETA, RCA, severity, and business impact. Zero data leaves the machine.

SCENARIO (use this for mock data):
JFrog Artifactory is down firm-wide. Harness pipeline team's CI is failing. Timmy manages Harness. His Teams chat is blowing up with engineers reporting failures. The JFrog incident ticket is being actively updated with ETA and RCA.

TECH STACK:
- Frontend: React + Vite + TypeScript + Tailwind CSS v4
- Backend: Node.js + Express (port 3001)
- LLM: Ollama running locally at http://localhost:11434, model gemma4:e4b
- State: Zustand
- LLM client: official `ollama` npm package

ARCHITECTURE:
- /server — Express backend
  - GET /api/teams-chat — returns mock Teams messages array
  - GET /api/incident-ticket — returns mock ServiceNow ticket JSON
  - GET /api/monitoring-status — returns mock Dynatrace status JSON
  - POST /api/summarize — calls Ollama gemma4:e4b with stream:true, pipes SSE to client
- /client — Vite React app
  - Three-panel layout: Chat Feed | Incident Ticker | COMM Output
  - Big "Refresh" button that fetches all sources then streams the summary
  - Tokens stream in live to the COMM panel
  - "Last updated" timestamp, severity badge (P1/P2/P3), copy-to-clipboard

LLM PROMPT REQUIREMENTS:
- system: You are an executive communications assistant. Never hallucinate. Only use the provided context.
- Output strict JSON: { severity, eta, rca, business_impact, comm_draft }
- temperature: 0.1, format: "json"
- Filter out the gemma4 `thinking` chunks from the SSE stream — show a subtle "Reasoning..." indicator while thinking, then stream the final answer

MOCK DATA:
Make the mock data realistic and detailed — 12+ Teams messages showing engineers discovering and escalating the JFrog outage, a ServiceNow ticket with status "In Progress", ETA "45 minutes", partial RCA "Artifactory storage volume exhausted".

EXTRAS:
- A scenario toggle button: "JFrog Down" vs "Auth Service Degraded" (second scenario uses different mock data)
- Network tab should show zero outbound requests (all localhost)

Start by scaffolding the full project structure, then implement backend first, then frontend.