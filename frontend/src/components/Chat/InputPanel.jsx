import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import './InputPanel.css';

const InputPanel = () => {
  const { submitQuery, isLoading, currentDisease } = useChat();
  const [activeTab, setActiveTab] = useState('natural');
  const [query, setQuery] = useState('');
  const [disease, setDisease] = useState(currentDisease || '');
  const [patientName, setPatientName] = useState('');
  const [location, setLocation] = useState('');
  const quickPrompts = [
    'Latest first-line treatment options',
    'Recent clinical trials and eligibility',
    'Evidence strength and limitations',
  ];

  const applyQuickPrompt = (prompt) => {
    setQuery(prompt);
  };

  const handleNaturalSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !disease.trim()) return;

    try {
      await submitQuery(query, disease);
      setQuery('');
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleStructuredSubmit = async (e) => {
    e.preventDefault();

    const structuredInput = {
      patientName: patientName || 'Patient',
      disease,
      location,
    };

    try {
      await submitQuery(
        `Patient inquiry about ${disease}${patientName ? ` (${patientName})` : ''}`,
        disease,
        structuredInput
      );
      setPatientName('');
      setDisease('');
      setLocation('');
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="input-panel">
      <div className="input-tabs">
        <button
          className={`tab ${activeTab === 'natural' ? 'active' : ''}`}
          onClick={() => setActiveTab('natural')}
        >
          💬 Natural Query
        </button>
        <button
          className={`tab ${activeTab === 'structured' ? 'active' : ''}`}
          onClick={() => setActiveTab('structured')}
        >
          📋 Structured Input
        </button>
      </div>

      {activeTab === 'natural' ? (
        <form onSubmit={handleNaturalSubmit} className="query-form">
          <div className="quick-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="quick-prompt-chip"
                onClick={() => applyQuickPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Disease/Condition *</label>
            <input
              className="input"
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="e.g., Lung cancer, Diabetes"
              required
            />
          </div>

          <div className="form-group">
            <label>Your Query *</label>
            <textarea
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about treatments, latest research, clinical trials..."
              rows={3}
              required
            />
            <div className="field-meta">{query.trim().length} characters</div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim() || !disease.trim()}
            className="submit-btn search-btn"
          >
            {isLoading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleStructuredSubmit} className="query-form">
          <div className="form-group">
            <label>Patient Name</label>
            <input
              className="input"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label>Disease/Condition *</label>
            <input
              className="input"
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="Primary concern"
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              className="input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country (for trial search)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !disease.trim()}
            className="submit-btn search-btn"
          >
            {isLoading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </form>
      )}
    </div>
  );
};

export default InputPanel;