
import React, { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import InputPanel from './InputPanel';
import './Chat.css';

const ChatInterface = () => {
  const { messages, isLoading, error, clearChat, currentDisease } = useChat();
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="header-title">
          <h1>Curalink</h1>
          <p>AI Medical Research Workspace</p>
        </div>
        <div className="header-actions">
          <div className="status-pill">
            {isLoading ? 'Searching sources...' : 'Ready'}
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
          >
            New Chat
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        <section className="query-section">
          <div className="query-section-header">
            <h2>Query Input</h2>
            <p>{currentDisease ? `Current condition: ${currentDisease}` : 'Start by adding disease and query context.'}</p>
          </div>
          <InputPanel />
        </section>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🧬</div>
            <h2>Research-ready assistant</h2>
            <p>Ask about conditions, treatment updates, evidence quality, and relevant clinical trials.</p>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

        {isLoading && (
          <section className="results-skeleton">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-card" />
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          </section>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

    </div>
  );
};

export default ChatInterface;