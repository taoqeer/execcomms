import { useStore } from '../store/useStore';

const statusColors: Record<string, string> = {
  DOWN: 'text-red-400',
  DEGRADED: 'text-yellow-400',
  CRITICAL: 'text-red-400',
  BLOCKED: 'text-orange-400',
  HEALTHY: 'text-green-400',
  STABLE: 'text-green-400',
};

const severityBg: Record<string, string> = {
  P1: 'bg-red-600 text-white',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-yellow-500 text-black',
};

export default function IncidentPanel() {
  const { incidentTicket, monitoringStatus, ticketLoading, ticketLastFetched, fetchTicket } = useStore();

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ServiceNow header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">ServiceNow Ticket</h2>
        <button
          onClick={fetchTicket}
          disabled={ticketLoading}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            ticketLoading
              ? 'bg-orange-900/40 text-orange-400/60 cursor-not-allowed'
              : 'bg-orange-900/20 hover:bg-orange-800/30 text-orange-400 border border-orange-800/40 hover:border-orange-700 active:scale-95'
          }`}
        >
          <svg
            className={`w-3 h-3 ${ticketLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {ticketLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {ticketLastFetched && (
        <div className="text-xs text-gray-700 -mt-3">
          Fetched {ticketLastFetched.toLocaleTimeString()}
        </div>
      )}

      {/* Ticket card */}
      {ticketLoading && !incidentTicket && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-gray-500">Fetching ticket...</p>
        </div>
      )}

      {!ticketLoading && !incidentTicket && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
          <p className="text-gray-600 text-sm">No ticket loaded</p>
          <p className="text-gray-700 text-xs">Hit Refresh to pull from ServiceNow</p>
        </div>
      )}

      {incidentTicket && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-gray-500 font-mono">{incidentTicket.ticket_id}</div>
              <div className="text-sm font-semibold text-gray-100 mt-0.5 leading-snug">{incidentTicket.title}</div>
            </div>
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded ${severityBg[incidentTicket.severity] ?? 'bg-gray-700'}`}>
              {incidentTicket.severity}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Status</span>
              <div className="text-yellow-400 font-medium">{incidentTicket.status}</div>
            </div>
            <div>
              <span className="text-gray-500">ETA</span>
              <div className="text-green-400 font-medium">{incidentTicket.eta_human}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Assigned To</span>
              <div className="text-gray-300">{incidentTicket.assigned_to}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">RCA Summary</div>
            <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{incidentTicket.rca}</p>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Affected Systems</div>
            <div className="flex flex-wrap gap-1">
              {incidentTicket.affected_systems.slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Comms Log</div>
            <div className="space-y-1">
              {incidentTicket.communication_log.map((entry, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-gray-600 font-mono flex-shrink-0">{entry.time}</span>
                  <span className="text-gray-400">{entry.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynatrace header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Dynatrace</h2>
        {monitoringStatus && (
          <span className={`ml-auto text-xs font-bold ${statusColors[monitoringStatus.overall_status] ?? 'text-gray-400'}`}>
            {monitoringStatus.overall_status}
          </span>
        )}
      </div>

      {monitoringStatus && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 space-y-2 flex-1 overflow-y-auto">
          {monitoringStatus.services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
              <div>
                <div className="text-xs font-medium text-gray-200">{svc.name}</div>
                {svc.latency_p99_ms != null && (
                  <div className="text-xs text-gray-600">p99: {svc.latency_p99_ms}ms</div>
                )}
                {svc.note && <div className="text-xs text-gray-600 max-w-[160px] truncate">{svc.note}</div>}
              </div>
              <span className={`text-xs font-bold ${statusColors[svc.status] ?? 'text-gray-400'}`}>
                {svc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
