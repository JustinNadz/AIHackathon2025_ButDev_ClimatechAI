import React, { useState, useRef, useEffect } from 'react';
import './AISummaryPanel.css';

const AISummaryPanel = ({ onLastMessageChange }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI map analysis assistant. Ask me anything about the map area you\'re viewing, and I\'ll provide insights about climate, geography, infrastructure, or any other aspects you\'re curious about.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [speechConfidence, setSpeechConfidence] = useState(0);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      
      const recognition = new SpeechRecognition();
      
      // Enhanced recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
      
      // Advanced settings for better accuracy
      if ('webkitSpeechGrammarList' in window) {
        const grammar = '#JSGF V1.0; grammar colors; public <color> = climate | weather | flood | disaster | population | infrastructure | analysis | map | location | area | temperature | rainfall | risk | assessment ;';
        const speechRecognitionList = new window.webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
      }

      recognition.onstart = () => {
        console.log('🎤 Speech Recognition: Started listening');
        setIsListening(true);
        setSpeechError('');
        setSpeechTranscript('');
        finalTranscriptRef.current = '';
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          
          maxConfidence = Math.max(maxConfidence, confidence);

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update final transcript accumulator
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript + ' ';
        }

        // Combine final and interim transcripts
        const fullTranscript = (finalTranscriptRef.current + interimTranscript).trim();
        
        setSpeechTranscript(fullTranscript);
        setSpeechConfidence(maxConfidence);
        setInputValue(fullTranscript);

        console.log('📝 Speech Recognition: Transcript:', fullTranscript);
        console.log('🎯 Speech Recognition: Confidence:', maxConfidence);

        // Clear existing timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }

        // Auto-send after pause (3 seconds of silence)
        if (finalTranscript && fullTranscript.trim().length > 0) {
          speechTimeoutRef.current = setTimeout(() => {
            console.log('🚀 Speech Recognition: Auto-sending message');
            handleSendMessage(fullTranscript.trim());
            stopListening();
          }, 3000);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech Recognition Error:', event.error);
        let errorMessage = '';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable microphone permissions.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = 'Speech recognition error occurred.';
        }
        
        setSpeechError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🛑 Speech Recognition: Ended');
        setIsListening(false);
        
        // Clear timeout when recognition ends
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
      console.log('❌ Speech Recognition: Not supported in this browser');
    }

    // Cleanup
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  // Update parent component with the last message for voice assistant
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (onLastMessageChange) {
      onLastMessageChange(lastMessage);
    }
  }, [messages, onLastMessageChange]);

  const startListening = () => {
    if (!recognitionRef.current || !isSpeechSupported) {
      setSpeechError('Speech recognition not available');
      return;
    }

    try {
      // Reset states
      setSpeechTranscript('');
      setSpeechError('');
      setSpeechConfidence(0);
      finalTranscriptRef.current = '';
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setSpeechError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
  };

  const handleSendMessage = async (messageContent = null) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSpeechTranscript('');
    finalTranscriptRef.current = '';
    setIsLoading(true);

    // Simulate AI response with varied, realistic responses
    setTimeout(() => {
      let aiResponseContent = '';
      
      // Generate realistic AI responses based on user input
      const userInput = userMessage.content.toLowerCase();
      
      if (userInput.includes('climate') || userInput.includes('weather')) {
        aiResponseContent = `Based on the map analysis of this area, I can see that the climate patterns show tropical characteristics with monsoon influences. The region experiences distinct wet and dry seasons, with average temperatures ranging from 24°C to 32°C. The coastal location moderates temperature extremes and influences local precipitation patterns.`;
      } else if (userInput.includes('flood') || userInput.includes('disaster')) {
        aiResponseContent = `This area shows significant flood risk indicators! The low-lying coastal areas and river systems create vulnerability to both tidal flooding and riverine flooding. Historical data suggests this region experiences seasonal flooding during monsoon periods. Proper drainage infrastructure and early warning systems are critical for disaster preparedness.`;
      } else if (userInput.includes('population') || userInput.includes('people')) {
        aiResponseContent = `The population density in this area is quite high, with urban centers showing concentrated development. Based on satellite imagery analysis, I can identify residential zones, commercial districts, and infrastructure patterns that indicate a population of approximately 400,000 to 500,000 people in the metropolitan area.`;
      } else if (userInput.includes('infrastructure') || userInput.includes('road') || userInput.includes('transport')) {
        aiResponseContent = `The infrastructure analysis reveals a well-developed transportation network with major highways, urban roads, and port facilities. The area has good connectivity with bridges spanning waterways and organized street grids in urban zones. However, some rural areas may need improved road access for disaster evacuation routes.`;
      } else if (userInput.includes('water') || userInput.includes('river') || userInput.includes('sea')) {
        aiResponseContent = `Water resources in this region are abundant, with multiple river systems and coastal access. The area benefits from both freshwater rivers and marine resources. However, water quality monitoring is essential due to urban runoff and potential saltwater intrusion in coastal aquifers.`;
      } else if (userInput.includes('hello') || userInput.includes('hi') || userInput.includes('help')) {
        aiResponseContent = `Hello! I'm your AI map analysis assistant. I can provide detailed insights about climate patterns, disaster risks, population demographics, infrastructure, and environmental conditions for any area you're viewing on the map. What specific information would you like to know about this location?`;
      } else if (userInput.includes('thank') || userInput.includes('thanks')) {
        aiResponseContent = `You're very welcome! I'm here to help with any geographic, climate, or infrastructure analysis you need. Feel free to ask about specific areas on the map, and I'll provide detailed insights to support your planning and decision-making.`;
      } else {
        // Default personalized response
        aiResponseContent = `I understand you're asking about "${userMessage.content}". Based on the map area you're currently viewing, I can provide comprehensive analysis including climate data, geographical features, infrastructure assessment, population density, and disaster risk evaluation. This area shows interesting characteristics that I'd be happy to explain in detail. What specific aspect would you like me to focus on?`;
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date()
      };
      
      console.log('🤖 AI Chatbot: Generated response:', aiResponseContent);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-summary-panel">
      <div className="ai-header">
        <h2>AI Map Analysis</h2>
        <p>Interactive analysis of your selected map area</p>
      </div>
      
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}-message`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          {/* Speech Status Display */}
          {isListening && (
            <div className="speech-status">
              <div className="speech-indicator">
                <div className="pulse-dot"></div>
                <span>Listening...</span>
              </div>
              {speechTranscript && (
                <div className="live-transcript">
                  "{speechTranscript}"
                </div>
              )}
              {speechConfidence > 0 && (
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${speechConfidence * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {/* Error Display */}
          {speechError && (
            <div className="speech-error">
              <span className="error-icon">⚠️</span>
              {speechError}
            </div>
          )}
          
          <div className="input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening to your voice..." : "Ask me about this map area..."}
              className={`message-input ${isListening ? 'listening' : ''}`}
              rows="1"
              disabled={isLoading}
            />
            
            {/* Microphone Button */}
            {isSpeechSupported && (
              <button 
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`mic-button ${isListening ? 'listening' : ''}`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <span className="mic-icon">
                  {isListening ? '🔴' : '🎤'}
                </span>
                {isListening && <div className="mic-pulse"></div>}
              </button>
            )}
            
            {/* Send Button */}
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="send-button"
              title="Send message"
            >
              <span className="send-icon">📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummaryPanel;
