import { useStore } from '../store/useStore';

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const avatarColors: Record<string, string> = {
  AC: 'bg-blue-600',
  PS: 'bg-purple-600',
  MW: 'bg-green-700',
  TN: 'bg-orange-600',
  LP: 'bg-pink-600',
  RP: 'bg-teal-600',
  JK: 'bg-indigo-600',
  ST: 'bg-yellow-700',
  DO: 'bg-red-700',
};

export default function ChatFeed() {
  const { teamsChat, chatLoading, chatLastFetched, fetchTeamsChat } = useStore();

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">MS Teams Chat</h2>
        {teamsChat.length > 0 && (
          <span className="text-xs text-gray-600">{teamsChat.length} messages</span>
        )}
        <button
          onClick={fetchTeamsChat}
          disabled={chatLoading}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            chatLoading
              ? 'bg-blue-900/40 text-blue-400/60 cursor-not-allowed'
              : 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border border-blue-800/50 hover:border-blue-700 active:scale-95'
          }`}
        >
          <svg
            className={`w-3 h-3 ${chatLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {chatLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {chatLastFetched && (
        <div className="text-xs text-gray-700 mb-3">
          Fetched {chatLastFetched.toLocaleTimeString()}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {!chatLoading && teamsChat.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="text-gray-600 text-sm">No messages loaded</p>
            <p className="text-gray-700 text-xs">Hit Refresh to pull the Teams chat</p>
          </div>
        )}

        {chatLoading && teamsChat.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        )}

        {teamsChat.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                avatarColors[msg.avatar] ?? 'bg-gray-700'
              }`}
            >
              {msg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-200">{msg.sender}</span>
                <span className="text-xs text-gray-600">{msg.role}</span>
                <span className="text-xs text-gray-700 ml-auto">{timeAgo(msg.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
