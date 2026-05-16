import { useState, useRef, useEffect } from 'react';
import { useStore } from './store/useStore';
import ChatFeed from './components/ChatFeed';
import IncidentPanel from './components/IncidentPanel';
import CommOutput from './components/CommOutput';

const incidents = [
  { id: 'jfrog' as const, label: 'JFrog Down', dot: 'bg-red-500' },
  { id: 'auth' as const, label: 'Auth Degraded', dot: 'bg-yellow-500' },
];

const stageConfig = {
  investigating: {
    label: 'Investigating',
    sublabel: 'RCA unknown · ETA unknown',
    dot: 'bg-red-500',
    pill: 'bg-red-950/60 border-red-700/50 text-red-300',
    bar: 'border-red-900/30 bg-red-950/10',
    color: 'text-red-400',
  },
  resolving: {
    label: 'Resolving',
    sublabel: 'RCA found · ETA known',
    dot: 'bg-yellow-500',
    pill: 'bg-yellow-950/60 border-yellow-700/50 text-yellow-300',
    bar: 'border-yellow-900/30 bg-yellow-950/10',
    color: 'text-yellow-400',
  },
  resolved: {
    label: 'Resolved',
    sublabel: 'Incident closed',
    dot: 'bg-green-500',
    pill: 'bg-green-950/60 border-green-700/50 text-green-300',
    bar: 'border-green-900/30 bg-green-950/10',
    color: 'text-green-400',
  },
} as const;

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-800/60 transition-colors group"
      >
        <div className="text-right hidden sm:block">
          <div className="text-xs text-gray-400 leading-tight">Welcome back,</div>
          <div className="text-sm font-semibold text-white leading-tight">Timmy</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          TN
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Profile card */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold text-white">
                TN
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Timmy Nguyen</div>
                <div className="text-xs text-gray-500">Product Owner</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {[
              { icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', label: 'Profile' },
              { icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Preferences' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-800 py-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { scenario, stage, commResult, setScenario, streamStatus, lastUpdated } = useStore();
  const activeStage = stageConfig[stage];;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">ExecComms</span>
              <span className="text-gray-600 text-xs ml-2">incident summarizer</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-800" />

          {/* Incidents tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Incidents</span>
            <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setScenario(inc.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    scenario === inc.id
                      ? 'bg-gray-800 text-white shadow'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${inc.dot}`} />
                  {inc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Incident status pill — set by LLM after summarization */}
          {commResult && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${activeStage.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeStage.dot}`} />
              {activeStage.label}
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                Summary {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-800 rounded-full px-3 py-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Zero data leaves machine
            </div>
            <ProfileDropdown />
          </div>
        </div>

        {/* Status context bar — only shown after LLM has determined the stage */}
        {commResult && (
          <div className={`border-t px-6 py-1.5 flex items-center gap-3 text-xs ${activeStage.bar}`}>
            <span className={`font-semibold ${activeStage.color}`}>{activeStage.label}</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-600">{activeStage.sublabel}</span>
            <span className="text-gray-700 ml-auto">
              {scenario === 'jfrog' ? 'JFrog Artifactory · INC0043821' : 'Auth Service EU-West · INC0043887'}
            </span>
          </div>
        )}
      </header>

      {/* LLM status bar */}
      {(streamStatus === 'reasoning' || streamStatus === 'streaming') && (
        <div className={`text-center text-xs py-1.5 font-medium ${
          streamStatus === 'reasoning'
            ? 'bg-purple-900/30 text-purple-400 border-b border-purple-800/40'
            : 'bg-blue-900/20 text-blue-400 border-b border-blue-800/30'
        }`}>
          {streamStatus === 'reasoning' ? '🔍 Reasoning through the incident...' : '✦ Streaming executive summary...'}
        </div>
      )}

      {/* Three-panel layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5 grid grid-cols-3 gap-5 min-h-0">
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
          <ChatFeed />
        </div>
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
          <IncidentPanel />
        </div>
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
          <CommOutput />
        </div>
      </main>
    </div>
  );
}
