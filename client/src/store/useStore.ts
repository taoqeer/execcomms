import { create } from 'zustand';

export type Scenario = 'jfrog' | 'auth';
export type Stage = 'investigating' | 'resolving' | 'resolved';
export type StreamStatus = 'idle' | 'reasoning' | 'streaming' | 'done' | 'error';

export interface TeamMessage {
  id: string;
  sender: string;
  avatar: string;
  role: string;
  timestamp: string;
  message: string;
}

export interface IncidentTicket {
  ticket_id: string;
  title: string;
  status: string;
  severity: string;
  priority: string;
  opened_at: string;
  updated_at: string;
  eta: string | null;
  eta_human: string;
  assigned_to: string;
  rca: string;
  business_impact: string;
  affected_systems: string[];
  affected_teams: string[];
  resolution_steps: string[];
  communication_log: { time: string; note: string }[];
}

export interface MonitoringStatus {
  source: string;
  pulled_at: string;
  overall_status: string;
  services: {
    name: string;
    status: string;
    error_rate?: string;
    latency_p99_ms?: number | null;
    alerts?: { severity: string; message: string; fired_at: string }[];
    note?: string;
  }[];
}

export interface CommResult {
  stage: Stage;
  severity: string;
  eta: string;
  rca: string;
  business_impact: string;
  comm_draft: string;
}

const STAGES: Stage[] = ['investigating', 'resolving', 'resolved'];

interface Store {
  scenario: Scenario;
  stage: Stage;
  chatRefreshCount: number;
  setScenario: (s: Scenario) => void;

  teamsChat: TeamMessage[];
  chatLoading: boolean;
  chatLastFetched: Date | null;

  incidentTicket: IncidentTicket | null;
  monitoringStatus: MonitoringStatus | null;
  ticketLoading: boolean;
  ticketLastFetched: Date | null;

  streamStatus: StreamStatus;
  rawStreamBuffer: string;
  thinkingBuffer: string;
  commResult: CommResult | null;
  hasSummarized: boolean;
  lastUpdated: Date | null;
  errorMessage: string | null;

  fetchTeamsChat: () => Promise<void>;
  fetchTicket: () => Promise<void>;
  summarize: () => Promise<void>;
}

const resetDataState = {
  teamsChat: [] as TeamMessage[],
  incidentTicket: null,
  monitoringStatus: null,
  commResult: null,
  rawStreamBuffer: '',
  thinkingBuffer: '',
  streamStatus: 'idle' as StreamStatus,
  chatLastFetched: null,
  ticketLastFetched: null,
  stage: 'investigating' as Stage,
  chatRefreshCount: 0,
};

export const useStore = create<Store>((set, get) => ({
  scenario: 'jfrog',
  stage: 'investigating',
  chatRefreshCount: 0,
  setScenario: (s) => set({ scenario: s, ...resetDataState }),

  teamsChat: [],
  chatLoading: false,
  chatLastFetched: null,

  incidentTicket: null,
  monitoringStatus: null,
  ticketLoading: false,
  ticketLastFetched: null,

  streamStatus: 'idle',
  rawStreamBuffer: '',
  thinkingBuffer: '',
  commResult: null,
  hasSummarized: false,
  lastUpdated: null,
  errorMessage: null,

  fetchTeamsChat: async () => {
    const { scenario, chatRefreshCount } = get();
    // Drives which mock data file to load — independent of the displayed stage
    const fileStage = STAGES[Math.min(chatRefreshCount, 2)];
    set({ chatLoading: true, chatRefreshCount: chatRefreshCount + 1 });
    try {
      const res = await fetch(`/api/teams-chat?scenario=${scenario}&stage=${fileStage}`);
      const teamsChat = await res.json();
      set({ teamsChat, chatLastFetched: new Date() });
    } finally {
      set({ chatLoading: false });
    }
  },

  fetchTicket: async () => {
    const { scenario, stage } = get();
    set({ ticketLoading: true });
    try {
      const [ticketRes, monitorRes] = await Promise.all([
        fetch(`/api/incident-ticket?scenario=${scenario}&stage=${stage}`),
        fetch(`/api/monitoring-status?scenario=${scenario}&stage=${stage}`),
      ]);
      const [incidentTicket, monitoringStatus] = await Promise.all([
        ticketRes.json(),
        monitorRes.json(),
      ]);
      set({ incidentTicket, monitoringStatus, ticketLastFetched: new Date() });
    } finally {
      set({ ticketLoading: false });
    }
  },

  summarize: async () => {
    const { teamsChat, incidentTicket, monitoringStatus } = get();
    set({ streamStatus: 'reasoning', commResult: null, rawStreamBuffer: '', thinkingBuffer: '', errorMessage: null });

    try {
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamsChat, incidentTicket, monitoringStatus }),
      });

      const reader = summarizeRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let jsonAccumulator = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === 'thinking_start') {
              set({ streamStatus: 'reasoning' });
            } else if (event.type === 'thinking') {
              set((s) => ({ thinkingBuffer: s.thinkingBuffer + event.content }));
            } else if (event.type === 'thinking_end') {
              set({ streamStatus: 'streaming' });
            } else if (event.type === 'token') {
              jsonAccumulator += event.content;
              set({ rawStreamBuffer: jsonAccumulator });
              try {
                const parsed = JSON.parse(jsonAccumulator);
                const llmStage = STAGES.includes(parsed.stage) ? parsed.stage : get().stage;
                set({ commResult: parsed, stage: llmStage });
              } catch {
                // accumulating
              }
            } else if (event.type === 'done') {
              try {
                const parsed = JSON.parse(jsonAccumulator);
                const llmStage = STAGES.includes(parsed.stage) ? parsed.stage : get().stage;
                set({ commResult: parsed, stage: llmStage, streamStatus: 'done', lastUpdated: new Date(), hasSummarized: true });
              } catch {
                set({ streamStatus: 'error', errorMessage: 'Failed to parse LLM response as JSON.' });
              }
            } else if (event.type === 'error') {
              set({ streamStatus: 'error', errorMessage: event.message });
            }
          } catch {
            // malformed SSE line
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ streamStatus: 'error', errorMessage: msg });
    }
  },
}));
