import React, { useState } from 'react';

// Medical keywords to highlight
const MEDICAL_KEYWORDS = [
  'insulin', 'metformin', 'glucose', 'diabetes', 'cancer', 'chemotherapy',
  'immunotherapy', 'radiation', 'surgery', 'therapy', 'treatment', 'dose',
  'mg', 'ml', 'clinical', 'trial', 'phase', 'study', 'patient', 'cohort',
  'efficacy', 'safety', 'adverse', 'event', 'response', 'survival', 'progression',
  'remission', 'relapse', 'metastasis', 'biomarker', 'genetic', 'mutation',
  'BRAF', 'EGFR', 'HER2', 'PD-L1', 'checkpoint', 'inhibitor', 'antibody',
  'vaccine', 'prevention', 'diagnosis', 'screening', 'monitoring'
];

const highlightMedicalKeywords = (text) => {
  if (!text) return text;
  
  let highlightedText = text;
  MEDICAL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<span class="highlight">${keyword}</span>`);
  });
  
  return highlightedText;
};

const clampText = (text = '', expanded = false) => {
  if (expanded || text.length <= 280) return text;
  return `${text.slice(0, 280)}...`;
};

const PaperCard = ({ insight, paper }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Support both insight and paper prop names, and both abstract/insight field names
  const data = insight || paper || {};
  const title = data?.title || 'No Title Available';
  const abstractText = data?.abstract || data?.insight || '';
  const hasLongText = abstractText.length > 280;
  
  const highlightedAbstract = highlightMedicalKeywords(clampText(abstractText, expanded));

  return (
    <article className="result-card paper-card">
      <header className="result-card-header">
        <h4>{title}</h4>
        <div className="result-card-meta">
          {data?.year ? <span className="source-badge">{data.year}</span> : null}
          {data?.source ? <span className="source-badge">{data.source}</span> : null}
          {data?.citationCount ? <span className="source-badge">{data.citationCount} citations</span> : null}
          {data?.journal ? <span className="source-badge">{data.journal}</span> : null}
          {data?.doi ? <span className="source-badge">DOI</span> : null}
        </div>
      </header>

      {abstractText && (
        <>
          <p 
            className="result-card-highlight" 
            dangerouslySetInnerHTML={{ __html: highlightedAbstract }}
          />
          {hasLongText ? (
            <button type="button" className="toggle-btn" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          ) : null}
        </>
      )}

      {data?.evidence ? (
        <div className="result-card-block">
          <h5>Evidence</h5>
          <p dangerouslySetInnerHTML={{ __html: highlightMedicalKeywords(data.evidence) }} />
        </div>
      ) : null}

      {data?.why_it_matters ? (
        <div className="result-card-block">
          <h5>Why it matters</h5>
          <p dangerouslySetInnerHTML={{ __html: highlightMedicalKeywords(data.why_it_matters) }} />
        </div>
      ) : null}

      {data?.url ? (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="result-card-link">
          View Paper →
        </a>
      ) : null}
    </article>
  );
};

export default PaperCard;
