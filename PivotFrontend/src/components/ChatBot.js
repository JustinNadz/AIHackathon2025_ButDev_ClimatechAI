import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi there! 👋 I\'m ClimatechAI, your personal climate and disaster preparedness assistant for the Philippines. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);

  // API base URL from environment or default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get user's location for location-based queries
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
          // Default to Philippines coordinates if location is not available
          setUserLocation({
            lat: 14.5995,
            lng: 120.9842
          });
        }
      );
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the enhanced assistant endpoint from the backend
      const response = await fetch(`${API_BASE_URL}/api/assistant/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          lat: userLocation?.lat,
          lng: userLocation?.lng
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response || data.advice || 'I apologize, but I couldn\'t process your request right now.',
        timestamp: new Date(),
        location: data.location,
        hazards: data.hazards
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Hi there! 👋 I\'m ClimatechAI, your personal climate and disaster preparedness assistant for the Philippines. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  const quickQuestions = [
    "What are the current weather conditions?",
    "Check flood risk in my area",
    "Emergency evacuation procedures",
    "What should I include in an emergency kit?",
    "Recent earthquake activity nearby"
  ];

  const sendQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <h3>🤖 ClimatechAI Assistant</h3>
          <span className="status-indicator">
            <span className="status-dot"></span>
            Online
          </span>
        </div>
        <button className="clear-chat-btn" onClick={clearChat}>
          🗑️
        </button>
      </div>

      <div className="quick-questions">
        <p>Quick questions:</p>
        <div className="quick-questions-grid">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-question-btn"
              onClick={() => sendQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">
                {message.content}
              </div>
              {message.hazards && (
                <div className="hazards-info">
                  <small>
                    📍 Location risks: 
                    {message.hazards.flood_risk && ` Flood: ${message.hazards.flood_risk}`}
                    {message.hazards.landslide_risk && ` | Landslide: ${message.hazards.landslide_risk}`}
                  </small>
                </div>
              )}
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about climate risks, emergency procedures, or safety tips..."
            disabled={isLoading}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot; 