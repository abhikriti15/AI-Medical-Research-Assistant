import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import './CleanChatInterface.css';

const CleanChatInterface = () => {
  const { messages, isLoading, error, clearChat, submitQuery } = useChat();
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    
    submitQuery(text, '');
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="clean-chat-interface">
      {/* Header */}
      <header className="clean-header">
        <div className="header-left">
          <h1 className="app-title">CuraLink</h1>
          <p className="app-subtitle">AI Medical Research Assistant</p>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="new-chat-btn"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
          >
            New Chat
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="clean-main">
        {/* Initial Search Hero */}
        {messages.length === 0 && (
          <div className="search-hero">
            <div className="search-container">
              <h2 className="hero-title">What medical research can I help you with?</h2>
              <p className="hero-subtitle">Ask about conditions, treatments, clinical trials, or evidence summaries</p>
              
              <form className="search-box" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for medical research..."
                  autoFocus
                />
                <button type="submit" disabled={!input.trim() || isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* After first query - Search box moves to top */}
        {messages.length > 0 && (
          <div className="top-search-container">
            <form className="search-box" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Follow up with another question..."
              />
              <button type="submit" disabled={!input.trim() || isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        )}

        {/* Messages Container */}
        <div className="messages-container">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
          
          {isLoading && messages.length > 0 && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <p className="loading-text">Searching medical databases...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>
      </main>
    </div>
  );
};

export default CleanChatInterface;