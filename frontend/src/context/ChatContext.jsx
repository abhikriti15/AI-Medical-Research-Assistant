import React, { createContext, useState, useCallback, useEffect } from 'react';
import { queryAPI } from '../services/api';

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const isValidSessionId = value =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [sessionId] = useState(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    return isValidSessionId(storedSessionId) ? storedSessionId : createId();
  });
  const [messages, setMessages] = useState([]);
  const [currentDisease, setCurrentDisease] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const addMessage = useCallback((role, content, metadata = {}) => {
    setMessages(prev => [
      ...prev,
      {
        id: createId(),
        role,
        content,
        timestamp: new Date(),
        ...metadata,
      },
    ]);
  }, []);

  const submitQuery = useCallback(async (query, disease = '') => {
    setIsLoading(true);
    setError(null);

    try {
      // Add user message
      addMessage('user', query);

      // Call API
      const response = await queryAPI.submitQuery(query, disease || currentDisease, sessionId);

      // Add assistant response as structured JSON for the results renderer
      addMessage('assistant', JSON.stringify(response), {
        papers: response.papers,
        trials: response.trials,
        metadata: response.metadata,
      });

      setResults(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to process query';
      setError(errorMessage);
      addMessage('assistant', `Error: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentDisease, addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setResults(null);
    setError(null);
  }, []);

  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        messages,
        addMessage,
        submitQuery,
        clearChat,
        currentDisease,
        setCurrentDisease,
        isLoading,
        setIsLoading,
        results,
        setResults,
        error,
        setError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};