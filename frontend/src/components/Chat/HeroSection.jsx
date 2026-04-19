import React from 'react';
import './HeroSection.css';

const HeroSection = ({ onQuerySelect }) => {
  const features = [
    {
      icon: '🔬',
      title: 'Research Insights',
      description: 'Access top medical publications from trusted sources like PubMed and OpenAlex.',
    },
    {
      icon: '🧪',
      title: 'Clinical Trials',
      description: 'Discover ongoing and completed clinical trials relevant to your condition.',
    },
    {
      icon: '🧠',
      title: 'AI Reasoning',
      description: 'Get structured, evidence-backed answers instead of generic responses.',
    },
  ];

  const sampleQueries = [
    'Latest treatment for diabetes',
    'Clinical trials for lung cancer',
    'Best therapies for Alzheimer\'s',
  ];

  const handleQueryClick = (query) => {
    onQuerySelect(query);
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        {/* Hero Title and Subtitle */}
        <div className="hero-header">
          <h1 className="hero-title">AI-Powered Medical Research Assistant</h1>
          <p className="hero-subtitle">
            Get evidence-based insights, clinical trials, and latest research — all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Sample Queries */}
        <div className="sample-queries-section">
          <p className="sample-queries-label">Try asking:</p>
          <div className="sample-queries-chips">
            {sampleQueries.map((query, index) => (
              <button
                key={index}
                className="query-chip"
                onClick={() => handleQueryClick(query)}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
