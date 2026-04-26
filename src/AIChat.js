import React, { useState } from 'react';
import './AIChat.css';

const AIChat = ({ backendUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Use the backend URL if provided, otherwise assume same domain
      const url = backendUrl ? `${backendUrl}/api/ai/chat` : '/api/ai/chat';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
      } else {
        setError(data.message || 'Error communicating with AI');
      }
    } catch (err) {
      setError('Failed to connect to AI server. Please check if the backend is running and the API key is set.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-container">
      {isOpen ? (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <h4>Ask OncoAI</h4>
            <button onClick={() => setIsOpen(false)} className="close-btn">&times;</button>
          </div>
          <div className="ai-chat-body">
            {response && (
              <div className="ai-response">
                <p>{response}</p>
              </div>
            )}
            {error && (
              <div className="ai-error">
                <p>{error}</p>
              </div>
            )}
            {loading && (
              <div className="ai-loading">
                <p>Thinking...</p>
              </div>
            )}
            {!response && !error && !loading && (
              <div className="ai-welcome">
                <p>Hello! I am OncoAI. How can I assist you with your oncology queries today?</p>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="ai-chat-form">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a medical question..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !prompt.trim()}>Send</button>
          </form>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="ai-chat-toggle">
          <span role="img" aria-label="robot">🤖</span> Ask AI
        </button>
      )}
    </div>
  );
};

export default AIChat;
