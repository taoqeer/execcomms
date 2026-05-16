import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

const severityBg: Record<string, string> = {
  P1: 'bg-red-600/20 border-red-600/50 text-red-400',
  P2: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  P3: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
};

export default function CommOutput() {
  const { streamStatus, commResult, rawStreamBuffer, thinkingBuffer, lastUpdated, errorMessage, hasSummarized, summarize, teamsChat, incidentTicket } = useStore();
  const [copied, setCopied] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(true);
  const thinkingRef = useRef<HTMLPreElement>(null);

  const isActive = streamStatus === 'reasoning' || streamStatus === 'streaming';
  const hasData = teamsChat.length > 0 && incidentTicket !== null;

  // Auto-scroll thinking box as text streams in
  useEffect(() => {
    if (thinkingRef.current && streamStatus === 'reasoning') {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinkingBuffer, streamStatus]);

  function handleCopy() {
    if (!commResult) return;
    const text = [
      `SEVERITY: ${commResult.severity}`,
      `ETA: ${commResult.eta}`,
      ``,
      `ROOT CAUSE:`,
      commResult.rca,
      ``,
      `BUSINESS IMPACT:`,
      commResult.business_impact,
      ``,
      `EXECUTIVE COMMUNICATION:`,
      commResult.comm_draft,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-green-700'}`} />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">COMM Output</h2>

        <div className="ml-auto flex items-center gap-2">
          {commResult && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}

          <button
            onClick={summarize}
            disabled={isActive || !hasData}
            title={!hasData ? 'Load Teams chat and ticket first' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-green-900/40 text-green-400/60 cursor-not-allowed'
                : !hasData
                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-800'
                : hasSummarized
                ? 'bg-green-900/20 hover:bg-green-800/30 text-green-400 border border-green-800/40 hover:border-green-700 active:scale-95'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30 active:scale-95'
            }`}
          >
            <svg
              className={`w-3 h-3 ${isActive ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              {isActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              ) : hasSummarized ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              )}
            </svg>
            {isActive ? 'Working...' : hasSummarized ? 'Refresh' : 'Summarize'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Idle state */}
        {streamStatus === 'idle' && !commResult && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">No summary generated yet</p>
              <p className="text-gray-700 text-xs mt-1">Select a scenario and hit Refresh</p>
            </div>
          </div>
        )}

        {/* Fetching state */}
        {streamStatus === 'fetching' && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm text-gray-500">Fetching incident data...</p>
          </div>
        )}

        {/* Thinking block — shown during reasoning AND kept visible after (collapsible) */}
        {thinkingBuffer && (streamStatus === 'reasoning' || streamStatus === 'streaming' || streamStatus === 'done') && (
          <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 overflow-hidden">
            <button
              onClick={() => setThinkingOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-900/20 transition-colors"
            >
              <svg
                className={`w-3 h-3 text-purple-400 transition-transform flex-shrink-0 ${thinkingOpen ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-purple-400">
                Model Reasoning
              </span>
              {streamStatus === 'reasoning' && (
                <span className="ml-auto flex items-center gap-1 text-xs text-purple-500">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                  thinking...
                </span>
              )}
              {streamStatus !== 'reasoning' && (
                <span className="ml-auto text-xs text-purple-700">{thinkingBuffer.length} chars</span>
              )}
            </button>

            {thinkingOpen && (
              <pre
                ref={thinkingRef}
                className="text-xs text-purple-300/70 font-mono leading-relaxed px-3 pb-3 whitespace-pre-wrap max-h-48 overflow-y-auto"
              >
                {thinkingBuffer}
                {streamStatus === 'reasoning' && (
                  <span className="inline-block w-0.5 h-3.5 bg-purple-400 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </pre>
            )}
          </div>
        )}

        {/* Error state */}
        {streamStatus === 'error' && (
          <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">Error generating summary</p>
            <p className="text-red-500/70 text-xs mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Streaming / Done state */}
        {(streamStatus === 'streaming' || streamStatus === 'done') && commResult && (
          <div className="space-y-4">
            {/* Severity + ETA badges */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${severityBg[commResult.severity] ?? 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                {commResult.severity}
              </span>
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400">ETA:</span>
                <span className="font-medium text-green-400">{commResult.eta}</span>
              </div>
              {streamStatus === 'streaming' && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-400">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  Streaming
                </div>
              )}
            </div>

            {/* RCA */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Root Cause</div>
              <p className="text-sm text-gray-200 leading-relaxed">{commResult.rca}</p>
            </div>

            {/* Business Impact */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Business Impact</div>
              <p className="text-sm text-gray-200 leading-relaxed">{commResult.business_impact}</p>
            </div>

            {/* COMM Draft */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Executive Communication Draft</div>
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">
                {commResult.comm_draft}
                {streamStatus === 'streaming' && (
                  <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>

            {lastUpdated && streamStatus === 'done' && (
              <div className="text-xs text-gray-700 text-right">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Streaming but JSON not yet parseable — show raw buffer */}
        {streamStatus === 'streaming' && !commResult && rawStreamBuffer && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Building response...
            </div>
            <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed">{rawStreamBuffer}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
