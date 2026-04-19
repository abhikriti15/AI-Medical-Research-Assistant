import React from 'react';
import PaperCard from './PaperCard';
import TrialCard from './TrialCard';
import './ResultsPage.css';

const SkeletonResults = () => {
  return (
    <div className="clean-results-page">
      <div className="clean-section">
        <h3 className="clean-section-title">Condition Overview</h3>
        <div className="clean-skeleton-card">
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text-short" />
        </div>
      </div>

      <div className="clean-section">
        <h3 className="clean-section-title">Key Research Insights</h3>
        <div className="clean-skeleton-card">
          <div className="clean-skeleton-title" />
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text-short" />
        </div>
      </div>

      <div className="clean-section">
        <h3 className="clean-section-title">Clinical Trials</h3>
        <div className="clean-skeleton-card">
          <div className="clean-skeleton-title" />
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text" />
          <div className="clean-skeleton-text-short" />
        </div>
      </div>
    </div>
  );
};

const SourceList = ({ sources = [] }) => {
  if (!sources.length) return null;

  return (
    <div className="clean-section">
      <h3 className="clean-section-title">Sources</h3>
      <div className="clean-source-list">
        {sources.map((source, index) => (
          <a
            key={`${source.url || source.title || 'source'}-${index}`}
            href={source.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="clean-source-item"
          >
            <div className="clean-source-title">{source.title || 'Untitled source'}</div>
            <div className="clean-source-meta">
              <span>{source.source || 'Research source'}</span>
              {source.year ? <span>{source.year}</span> : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const ResultsPage = ({ response, isLoading = false }) => {
  // Show skeleton loading state
  if (isLoading) {
    return <SkeletonResults />;
  }

  const payload = response?.response || response || {};
  const summary = payload?.summary || response?.summary || payload?.conditionOverview || response?.conditionOverview;
  
  // Extract papers - they come from response.papers in the backend response
  const papers = payload?.papers || response?.papers || [];
  const insights = papers.length > 0 ? papers : (payload?.keyResearchInsights || response?.keyResearchInsights || []);
  
  const trials = payload?.trials || response?.trials || payload?.clinicalTrials || response?.clinicalTrials || [];
  const legacyTrialText = payload?.trialRecommendations || response?.trialRecommendations;
  const sources = payload?.sources || payload?.sourceAttribution || response?.sources || response?.sourceAttribution || [];

  return (
    <div className="clean-results-page">
      {summary && (
        <div className="clean-section">
          <h3 className="clean-section-title">Condition Overview</h3>
          <div className="clean-response-card">
            <p>{summary}</p>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="clean-section">
          <h3 className="clean-section-title">Key Research Insights</h3>
          <div className="clean-results-list">
            {insights.map((insight, index) => (
              <PaperCard
                key={`${insight.title || insight.id || 'insight'}-${index}`}
                insight={insight}
                paper={insight}
              />
            ))}
          </div>
        </div>
      )}

      {trials.length > 0 && (
        <div className="clean-section">
          <h3 className="clean-section-title">Clinical Trials</h3>
          <div className="clean-results-list">
            {trials.map((trial, index) => (
              <TrialCard key={`${trial.title || trial.id || 'trial'}-${index}`} trial={trial} />
            ))}
          </div>
        </div>
      )}

      {!insights.length && !trials.length && legacyTrialText && (
        <div className="clean-section">
          <h3 className="clean-section-title">Clinical Trials</h3>
          <div className="clean-response-card">
            <p>{legacyTrialText}</p>
          </div>
        </div>
      )}

      {response?.finalTakeaway && (
        <div className="clean-section">
          <h3 className="clean-section-title">Final Takeaway</h3>
          <div className="clean-response-card">
            <p>{response.finalTakeaway}</p>
          </div>
        </div>
      )}

      <SourceList sources={sources} />
    </div>
  );
};

export default ResultsPage;
