const { generateResponse } = require('../../config/ollama');
const logger = require('../../config/logger');
const overviewGenerator = require('./overviewGenerator');

class OllamaService {
  async generateResponse(papers, trials, query, disease) {
    try {
      const papersText = papers
        .slice(0, 5)
        .map(
          (p, i) =>
            `${i + 1}. "${p.title}" (${p.year}, ${p.source}, Citations: ${p.citationCount})\n   Abstract: ${p.abstract?.substring(0, 300)}...`
        )
        .join('\n\n');

      const trialsText = trials
        .slice(0, 3)
        .map(
          (t, i) =>
            `${i + 1}. ${t.title}\n   Status: ${t.status} | Phase: ${t.phase} | Enrollment: ${t.enrollmentCount}`
        )
        .join('\n\n');

      const prompt = `You are a medical expert creating a patient-friendly condition overview. Based on the research papers and clinical trials below, generate a clean, structured summary.

USER QUERY: "${query}"
CONDITION: "${disease}"

RESEARCH CONTEXT (for background knowledge only - DO NOT list these):
${papersText || 'No papers found'}

CLINICAL TRIALS CONTEXT (for background knowledge only - DO NOT list these):
${trialsText || 'No trials found'}

CRITICAL INSTRUCTIONS:
1. DO NOT list papers, citations, DOIs, or raw abstracts
2. DO NOT include paper titles or authors
3. Use the research ONLY as background knowledge to inform your summary
4. Generate a human-readable overview for patients and clinicians

REQUIRED OUTPUT STRUCTURE:
1. Condition Overview: What the condition is, why it matters
2. Current Understanding: What recent research indicates
3. Treatment Approaches: Key treatment options based on evidence
4. Clinical Evidence: What clinical trials and studies suggest
5. Summary: Overall implications and considerations

FORMAT RULES:
- 3-5 short paragraphs total
- Simple, clear, professional language
- No bullet points or numbered lists in the overview
- No citations or references in the text
- Focus on synthesizing information, not listing sources

EXAMPLE FORMAT:
"Varicocele is a condition that affects... Recent research indicates that... Treatment options include... Clinical evidence suggests..."

Generate ONLY the clean text overview.`;

      const response = await generateResponse(prompt, {
        temperature: 0.7,
        topP: 0.9,
      });

      logger.info('LLM response generated successfully');

      // Clean up the response - remove any remaining citations or list formatting
      const cleanResponse = this.cleanOverviewResponse(response);

      return {
        summary: cleanResponse,
        papers: papers.slice(0, 5),
        trials: trials.slice(0, 3),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`LLM generation error: ${error.message}`);
      
      // Use overview generator for clean fallback response
      const disease = this.extractDiseaseFromQuery(query);
      const fallbackOverview = overviewGenerator.generateOverview(papers, trials, query, disease);
      
      return {
        summary: fallbackOverview,
        papers: papers.slice(0, 5),
        trials: trials.slice(0, 3),
        generatedAt: new Date().toISOString(),
        fallback: true,
      };
    }
  }

  generateFallbackResponse(papers, trials, query) {
    // Use the overview generator for consistent formatting
    const disease = this.extractDiseaseFromQuery(query);
    return overviewGenerator.generateOverview(papers, trials, query, disease);
  }

  /**
   * Clean up LLM response to ensure no citations or lists
   * @param {string} response - Raw LLM response
   * @returns {string} Cleaned response
   */
  cleanOverviewResponse(response) {
    if (!response) return '';

    // Remove citations like [1], (Smith et al., 2023), etc.
    let clean = response
      .replace(/\[\d+\]/g, '') // Remove [1], [2], etc.
      .replace(/\(\s*[A-Za-z\s]+,\s*\d{4}\s*\)/g, '') // Remove (Author, 2023)
      .replace(/et al\./g, '') // Remove et al.
      .replace(/\d+\.\s+/g, '') // Remove numbered lists "1. ", "2. "
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/#/g, '') // Remove markdown headers
      .replace(/- /g, '') // Remove bullet points
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();

    // Ensure it's proper paragraphs
    const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Group into 3-5 paragraphs
    const paragraphs = [];
    const sentencesPerParagraph = Math.ceil(sentences.length / 4);
    
    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
      const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
      const paragraph = paragraphSentences.join('. ').trim() + '.';
      if (paragraph.length > 10) {
        paragraphs.push(paragraph);
      }
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Extract disease from query
   * @param {string} query - User query
   * @returns {string} Extracted disease
   */
  extractDiseaseFromQuery(query) {
    if (!query) return 'medical condition';
    
    // Remove common query terms
    const cleanQuery = query.toLowerCase()
      .replace(/\b(treatment|therapy|clinical|trial|medicine|drug|options|management)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanQuery || 'medical condition';
  }

  /**
   * Rerank papers using LLM for strict relevance filtering
   * @param {string} prompt - Reranking prompt
   * @returns {Object} LLM response with ranked IDs
   */
  async rerankWithLLM(prompt) {
    try {
      const response = await generateResponse(prompt, {
        temperature: 0.3, // Lower temperature for more consistent ranking
        topP: 0.8,
      });

      logger.info('LLM reranking response received');
      
      // Parse the response to extract ranked IDs
      const rankedIds = this.parseRankingResponse(response);
      
      return {
        success: true,
        rankedIds: rankedIds,
        rawResponse: response
      };
      
    } catch (error) {
      logger.error(`LLM reranking error: ${error.message}`);
      
      return {
        success: false,
        rankedIds: [],
        error: error.message
      };
    }
  }

  /**
   * Parse LLM response to extract ranked IDs
   * @param {string} response - LLM response
   * @returns {Array} Array of ranked IDs (1-indexed)
   */
  parseRankingResponse(response) {
    if (!response) {
      return [];
    }

    // Look for "TOP_5:" pattern
    const top5Match = response.match(/TOP_5:\s*(\d+(?:\s*,\s*\d+)*)/);
    if (top5Match) {
      const ids = top5Match[1].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      return ids.slice(0, 5);
    }

    // Look for numbered list
    const listMatches = response.match(/\d+\.\s*\[?(\d+)\]?/g);
    if (listMatches) {
      const ids = listMatches.map(match => {
        const idMatch = match.match(/\d+/);
        return idMatch ? parseInt(idMatch[0]) : null;
      }).filter(id => id !== null);
      return ids.slice(0, 5);
    }

    // Fallback: extract any numbers that could be IDs
    const numberMatches = response.match(/\b([1-9]|1[0-9]|20)\b/g);
    if (numberMatches) {
      const ids = [...new Set(numberMatches.map(num => parseInt(num)))].slice(0, 5);
      return ids;
    }

    return [];
  }
}

module.exports = new OllamaService();