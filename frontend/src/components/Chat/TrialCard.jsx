import React, { useState } from 'react';
import './TrialCard.css';

export default function TrialCard({ trial }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      RECRUITING: '#4caf50',
      ACTIVE_NOT_RECRUITING: '#2196f3',
      ENROLLING_BY_INVITATION: '#ff9800',
      NOT_YET_RECRUITING: '#9c27b0',
      COMPLETED: '#757575',
      TERMINATED: '#f44336',
      WITHDRAWN: '#9e9e9e',
    };
    return colors[status] || '#999';
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'Phase 1': '#3b82f6',
      'Phase 2': '#8b5cf6',
      'Phase 3': '#10b981',
      'Phase 4': '#f59e0b',
    };
    return colors[phase] || '#6b7280';
  };

  // Medical keywords to highlight
  const highlightMedicalKeywords = (text) => {
    if (!text) return text;
    
    const MEDICAL_KEYWORDS = [
      'insulin', 'metformin', 'glucose', 'diabetes', 'cancer', 'chemotherapy',
      'immunotherapy', 'radiation', 'surgery', 'therapy', 'treatment', 'dose',
      'mg', 'ml', 'clinical', 'trial', 'phase', 'study', 'patient', 'cohort',
      'efficacy', 'safety', 'adverse', 'event', 'response', 'survival', 'progression',
      'remission', 'relapse', 'metastasis', 'biomarker', 'genetic', 'mutation'
    ];
    
    let highlightedText = text;
    MEDICAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="highlight">${keyword}</span>`);
    });
    
    return highlightedText;
  };

  return (
    <div className="trial-card">
      <div className="trial-header">
        <div className="trial-title-section">
          <h4 className="trial-title">{trial.title}</h4>
          <div className="trial-badges">
            <span
              className="badge status-badge"
              style={{ backgroundColor: getStatusColor(trial.status) }}
            >
              {trial.status?.replace(/_/g, ' ')}
            </span>
            <span className="badge phase-badge" style={{ backgroundColor: getPhaseColor(trial.phase), color: '#ffffff' }}>
              {trial.phase}
            </span>
            {trial.nctId && (
              <span className="badge source-badge">
                {trial.nctId}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="trial-meta">
        <div className="meta-item">
          <span className="meta-label">Enrollment</span>
          <span className="meta-value">{trial.enrollmentCount || 0} participants</span>
        </div>
        {trial.startDate && (
          <div className="meta-item">
            <span className="meta-label">Started</span>
            <span className="meta-value">{new Date(trial.startDate).getFullYear()}</span>
          </div>
        )}
        {trial.completionDate && (
          <div className="meta-item">
            <span className="meta-label">Completion</span>
            <span className="meta-value">{new Date(trial.completionDate).getFullYear()}</span>
          </div>
        )}
      </div>

      {trial.description && (
        <div className="trial-description">
          <p dangerouslySetInnerHTML={{ __html: highlightMedicalKeywords(
            expanded ? trial.description : `${trial.description.substring(0, 120)}...`
          ) }} />
          {trial.description.length > 120 && (
            <button
              className="btn-expand"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {trial.locations && trial.locations.length > 0 && (
        <div className="trial-locations">
          <p className="locations-label">📍 Locations</p>
          <div className="locations-list">
            {trial.locations.slice(0, 3).map((loc, idx) => (
              <span key={idx} className="location-tag">
                {loc.city}, {loc.state}
              </span>
            ))}
            {trial.locations.length > 3 && (
              <span className="location-tag">+{trial.locations.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      <a
        href={trial.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-view-trial"
      >
        View on ClinicalTrials.gov →
      </a>
    </div>
  );
}
