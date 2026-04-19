import React from 'react';
import ResultsPage from './ResultsPage';
import './MessageBubble.css';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  let parsedResponse = null;

  if (!isUser && message.content.startsWith('{')) {
    try {
      parsedResponse = JSON.parse(message.content);
    } catch (e) {
      // Not valid JSON, use as-is
    }
  }

  return (
    <div className={`clean-message-bubble ${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        <div className="clean-user-message">
          <div className="clean-message-content">
            <p>{message.content}</p>
          </div>
        </div>
      ) : parsedResponse ? (
        <div className="clean-assistant-message">
          <ResultsPage response={parsedResponse} isLoading={message.isLoading} />
        </div>
      ) : (
        <div className="clean-assistant-message error">
          <p>{message.content}</p>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;