import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import axios from 'axios';

// Default to Vite proxy in development to avoid CORS issues.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');

  const submitQuery = async (query, disease, structuredInput = null) => {
    context.setIsLoading(true);
    context.setError(null);

    try {
      // Add user message
      context.addMessage('user', query);

      // Call backend
      const payload = {
        query,
        disease,
        sessionId: context.sessionId,
      };

      if (structuredInput) {
        payload.structuredInput = structuredInput;
      }

      const response = await axios.post(`${API_BASE_URL}/query`, payload, {
        timeout: 60000,
      });

      console.log('useChat - Full response:', response.data);
      console.log('useChat - Response object:', response.data.response);
      console.log('useChat - Papers:', response.data.response?.papers);
      console.log('useChat - Trials:', response.data.response?.trials);
      console.log('useChat - Summary:', response.data.response?.summary);

      // Ensure response has proper structure
      const normalizedResponse = {
        ...response.data,
        response: {
          summary: response.data.response?.summary || `Search completed for: "${query}"`,
          papers: Array.isArray(response.data.response?.papers) ? response.data.response.papers : [],
          trials: Array.isArray(response.data.response?.trials) ? response.data.response.trials : [],
          generatedAt: response.data.response?.generatedAt || new Date().toISOString(),
          fallback: response.data.response?.fallback || false,
        }
      };

      // Update state
      context.setCurrentDisease(disease);
      context.setResults(normalizedResponse);

      // Add assistant message
      context.addMessage('assistant', JSON.stringify(normalizedResponse.response));

      return normalizedResponse;
    } catch (err) {
      console.error('useChat - API Error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to get response. Please try again.';
      context.setError(errorMsg);
      
      // Create a fallback response even on error
      const fallbackResponse = {
        response: {
          summary: `Search for "${query}" encountered an issue. Please try again.`,
          papers: [],
          trials: [],
          generatedAt: new Date().toISOString(),
          fallback: true,
          error: errorMsg,
        }
      };
      
      context.addMessage('assistant', JSON.stringify(fallbackResponse.response));
      throw err;
    } finally {
      context.setIsLoading(false);
    }
  };

  return {
    ...context,
    submitQuery,
  };
};