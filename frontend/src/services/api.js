import axios from 'axios';

// Default to Vite proxy in development to avoid CORS and dynamic port issues.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '/_/backend/api');
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionId');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const queryAPI = {
  normalizeQueryResponse(data) {
    const llmPayload = data?.response || {};

    return {
      ...data,
      papers: Array.isArray(llmPayload.papers) ? llmPayload.papers : [],
      trials: Array.isArray(llmPayload.trials) ? llmPayload.trials : [],
      summary: llmPayload.summary || '',
      fallback: Boolean(llmPayload.fallback),
    };
  },

  // Submit a query
  async submitQuery(query, disease = '', sessionId = null) {
    try {
      const response = await apiClient.post('/query', {
        query,
        disease,
        sessionId,
        structuredInput: false,
      });
      
      // Debug: Log the response structure
      console.log('API Response:', response.data);
      console.log('Papers:', response.data.response?.papers);
      
      // Store session ID
      if (response.data.sessionId) {
        localStorage.setItem('sessionId', response.data.sessionId);
      }
      
      return this.normalizeQueryResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Get session details
  async getSession(sessionId) {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Get conversation history
  async getHistory(sessionId) {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/history`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  },

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: 'error',
        message: error.response.data?.error || 'Server error',
        details: error.response.data?.details || error.response.data?.message,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 'error',
        message: 'No response from server',
        details: 'Please check your connection',
      };
    } else {
      // Error in request setup
      return {
        status: 'error',
        message: error.message || 'Unknown error',
      };
    }
  },
};

export default apiClient;
