import React, { useMemo, useState } from 'react';
import './ModernChat.css';

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialMessages = [
  {
    id: createId(),
    role: 'assistant',
    content: 'Welcome back. Ask for treatment updates, trial matches, or mechanism summaries.',
    status: 'sent',
  },
  {
    id: createId(),
    role: 'user',
    content: 'Give me recent advances for stage IV melanoma with BRAF mutation.',
    status: 'sent',
  },
  {
    id: createId(),
    role: 'assistant',
    content: 'I can prioritize targeted options, checkpoint combinations, and active trial cohorts.',
    status: 'sent',
  },
];

const LoadingSkeleton = () => (
  <div className="modern-glass modern-message animate-fade-in-up rounded-2xl border border-glass-border bg-glass-white p-4 shadow-soft backdrop-blur-xl transition-all duration-300">
    <div className="mb-3 h-3 w-24 rounded-full bg-white/20" />
    <div className="space-y-2">
      <div className="modern-skeleton skeleton-shimmer animate-shimmer h-3 w-full rounded-full bg-white/15" />
      <div className="modern-skeleton skeleton-shimmer animate-shimmer h-3 w-5/6 rounded-full bg-white/15" />
      <div className="modern-skeleton skeleton-shimmer animate-shimmer h-3 w-3/5 rounded-full bg-white/15" />
    </div>
  </div>
);

export default function ModernChatInterface() {
  const [messages, setMessages] = useState(initialMessages);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const queueLabel = useMemo(() => {
    if (messageQueue.length === 0) return 'Queue empty';
    if (messageQueue.length === 1) return '1 message sending';
    return `${messageQueue.length} messages sending`;
  }, [messageQueue.length]);

  const sendMessage = e => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const optimisticId = createId();
    const queueId = createId();

    setInput('');
    setMessageQueue(prev => [...prev, queueId]);
    setMessages(prev => [...prev, { id: optimisticId, role: 'user', content: text, status: 'sending' }]);
    setIsLoading(true);

    window.setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId
            ? {
                ...msg,
                status: 'sent',
              }
            : msg
        )
      );

      setMessages(prev => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          status: 'sent',
          content: `Draft response prepared for: "${text}". You can now continue the thread with refinements.`,
        },
      ]);

      setMessageQueue(prev => prev.filter(id => id !== queueId));
      setIsLoading(false);
    }, 1100);
  };

  return (
    <div className="modern-chat-root min-h-screen bg-gradient-to-br from-blue-700 via-cyan-700 to-teal-600 px-4 py-5 text-slate-50 transition-all duration-300 sm:px-6 sm:py-8 lg:px-10">
      <div className="modern-chat-shell mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
        <aside className="modern-glass modern-panel animate-fade-in-up rounded-2xl border border-glass-border bg-glass-white p-4 shadow-soft backdrop-blur-xl transition-all duration-300 sm:p-5 lg:col-span-4 xl:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Session Status</p>
          <h2 className="mt-2 text-xl font-semibold">Modern Chat Interface</h2>
          <p className="modern-muted mt-3 text-sm text-cyan-50/90">
            Designed for quick medical research interactions with optimistic updates and animated queue handling.
          </p>

          <div className="modern-surface-strong mt-5 rounded-xl border border-white/20 bg-slate-950/20 p-3 transition-all duration-300">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-100/80">Message Queue</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-cyan-50">{queueLabel}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${
                  messageQueue.length > 0
                    ? 'modern-queue-active animate-queue-pulse bg-emerald-300/25 text-emerald-100'
                    : 'bg-white/10 text-cyan-100/80'
                }`}
              >
                {messageQueue.length > 0 ? 'Active' : 'Idle'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMessages(initialMessages);
              setMessageQueue([]);
              setIsLoading(false);
            }}
            className="modern-interactive mt-5 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-glow"
          >
            Reset Conversation
          </button>
        </aside>

        <main className="modern-glass modern-panel animate-fade-in-up rounded-2xl border border-glass-border bg-glass-white shadow-soft backdrop-blur-xl transition-all duration-300 lg:col-span-8 xl:col-span-9">
          <div className="flex h-[72vh] min-h-[520px] flex-col sm:h-[76vh]">
            <div className="border-b border-white/20 px-4 py-4 sm:px-6">
              <h1 className="text-lg font-semibold sm:text-xl">Clinical Research Copilot</h1>
              <p className="mt-1 text-sm text-cyan-50/90">Smooth transitions, glass cards, and responsive messaging.</p>
            </div>

            <div className="modern-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6">
              {messages.map((msg, index) => (
                <article
                  key={msg.id}
                  className={`modern-message modern-glass animate-fade-in-up rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-xl transition-all duration-300 ${
                    msg.role === 'assistant'
                      ? 'mr-8 border-white/20 bg-white/12 sm:mr-16'
                      : 'ml-8 border-cyan-200/40 bg-cyan-100/15 sm:ml-16'
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-50/90">
                      {msg.role === 'assistant' ? 'Assistant' : 'You'}
                    </span>
                    {msg.status === 'sending' && (
                      <span className="rounded-full bg-amber-200/25 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                        sending
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-100 sm:text-[15px]">{msg.content}</p>
                </article>
              ))}

              {isLoading && <LoadingSkeleton />}
            </div>

            <form
              onSubmit={sendMessage}
              className="modern-input-panel animate-slide-up border-t border-white/20 px-4 py-4 transition-all duration-300 sm:px-6"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your next question..."
                  className="modern-interactive w-full rounded-xl border border-white/30 bg-slate-900/20 px-4 py-3 text-sm text-white placeholder:text-cyan-100/60 shadow-soft outline-none transition-all duration-300 focus:border-cyan-200 focus:bg-slate-900/30 focus:shadow-glow"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="modern-interactive rounded-xl border border-cyan-100/40 bg-cyan-200/20 px-5 py-3 text-sm font-semibold text-cyan-50 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-100/30 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
