import React from 'react';
import { ChatProvider } from './context/ChatContext';
import CleanChatInterface from './components/Chat/CleanChatInterface';
import './styles/global.css';
import './styles/variables.css';

function App() {
  return (
    <ChatProvider>
      <CleanChatInterface />
    </ChatProvider>
  );
}

export default App;