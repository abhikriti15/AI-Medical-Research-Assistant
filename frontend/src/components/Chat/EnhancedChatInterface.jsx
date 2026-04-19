import React, { useContext, useState, useRef, useEffect } from 'react';
import { ChatContext } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import PaperCard from './PaperCard';
import TrialCard from './TrialCard';
import HeroSection from './HeroSection';
import LoadingSpinner from '../Common/LoadingSpinner';
import './EnhancedChat.css';

export default function EnhancedChatInterface() {
  const {
    messages,
    submitQuery,
    isLoading,
    error,
    currentDisease,
    setCurrentDisease,
    clearChat,
    results,
  } = useContext(ChatContext);

  const [input, setInput] = useState('');
  const [disease, setDisease] = useState('');
  const [showResults, setShowResults] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim();
    const diseaseContext = disease.trim() || currentDisease;

    setInput('');
    if (diseaseContext) {
      setCurrentDisease(diseaseContext);
    }

    await submitQuery(query, diseaseContext);
    setShowResults(true);
  };

  const handleQuerySelect = (query) => {
    setInput(query);
  };

  return (
    <div className="enhanced-chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <h1>🔬 CuraLink</h1>
          <p>AI Medical Research Assistant</p>
        </div>
        {messages.length > 0 && (
          <button className="btn-reset" onClick={clearChat}>
            New Chat
          </button>
        )}
      </header>

      <div className="chat-main">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-section">
            <h3>Medical Context</h3>
            <input
              type="text"
              placeholder="e.g., Type 2 Diabetes"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="disease-input"
            />
            <p className="sidebar-hint">
              Provide a disease or condition to improve search results
            </p>
          </div>

          {results && (
            <div className="sidebar-section">
              <h3>Results Summary</h3>
              <div className="results-summary">
                <div className="summary-item">
                  <span className="label">Papers Found</span>
                  <span className="value">{results.papers?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Trials Found</span>
                  <span className="value">{results.trials?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Response Time</span>
                  <span className="value">
                    {results.metadata?.responseTime || 0}ms
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <main className="chat-area">
          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <>
                <HeroSection onQuerySelect={handleQuerySelect} />
              </>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && <LoadingSpinner />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Results Display */}
          {showResults && results && (
            <div className="results-section">
              <div className="results-header">
                <h3>Research Results</h3>
                <button
                  className="btn-close"
                  onClick={() => setShowResults(false)}
                >
                  ✕
                </button>
              </div>

              {results.papers && results.papers.length > 0 && (
                <div className="results-group">
                  <h4>📄 Top Research Papers</h4>
                  <div className="cards-grid">
                    {results.papers.map((paper) => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>
                </div>
              )}

              {results.trials && results.trials.length > 0 && (
                <div className="results-group">
                  <h4>🏥 Clinical Trials</h4>
                  <div className="cards-grid">
                    {results.trials.map((trial) => (
                      <TrialCard key={trial.id} trial={trial} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about medical research, treatments, or clinical trials..."
                disabled={isLoading}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-send"
              >
                {isLoading ? '⏳' : '→'}
              </button>
            </div>
            <p className="input-hint">
              Press Enter or click the button to send your query
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
