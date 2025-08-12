import React, { useEffect, useRef, useState } from 'react';
import './VoiceAssistant.css';

const VoiceAssistant = ({ lastChatMessage }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const synthRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;
    
    // Function to find and set the best male voice
    const findBestMaleVoice = () => {
      if (!synthRef.current) return;
      
      const voices = synthRef.current.getVoices();
      
      // Priority order for David voice specifically (removing Alex and others)
      const preferredMaleVoices = [
        // Prioritize David voices only
        'Microsoft David - English (United States)',
        'Microsoft David Desktop - English (United States)',
        'David', // macOS David
        // Fallback to other quality male voices if David not available
        'Microsoft Mark - English (United States)', 
        'Microsoft Mark Desktop - English (United States)',
        'Google US English Male',
        'Microsoft George - English (United Kingdom)',
        'Microsoft James - English (Australia)',
        // Final fallbacks
        'Male',
        'Man',
        'Deep'
      ];
      
      // Find the best available David voice first
      let bestVoice = null;
      
      for (const preferredName of preferredMaleVoices) {
        bestVoice = voices.find(voice => 
          voice.name.includes(preferredName) ||
          voice.name.toLowerCase().includes(preferredName.toLowerCase())
        );
        if (bestVoice) break;
      }
      
      // If no preferred voice found, look for any David-like voice specifically
      if (!bestVoice) {
        bestVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('man') ||
          voice.gender === 'male'
        );
      }
      
      // Fallback to first available voice if no male voice found
      if (!bestVoice && voices.length > 0) {
        bestVoice = voices[0];
      }
      
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, gender: v.gender || 'unknown' })));
      console.log('Selected voice:', bestVoice?.name || 'None available');
      
      setSelectedVoice(bestVoice);
    };

    // Try to get voices immediately
    findBestMaleVoice();
    
    // Voices might not be loaded yet, so set up event listener
    const handleVoicesChanged = () => {
      findBestMaleVoice();
    };
    
    synthRef.current.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Cleanup
    return () => {
      if (synthRef.current) {
        synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, []);

  // Show voice assistant and speak when AI responds
  useEffect(() => {
    if (lastChatMessage && lastChatMessage.type === 'ai' && synthRef.current) {
      console.log('🎤 Voice Assistant: New AI message received:', lastChatMessage.content);
      setIsVisible(true);
      speakText(lastChatMessage.content);
    }
  }, [lastChatMessage, selectedVoice]);

  const addEmotionalInflection = (text) => {
    // Clean the text first - remove any unwanted characters but preserve the original message
    let cleanText = text;
    
    // Remove any HTML tags if present
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Add natural pauses for better speech flow (without changing the actual content)
    let emotionalText = cleanText;
    
    // Add slight pauses after sentences for more natural flow
    emotionalText = emotionalText.replace(/\.\s+/g, '... ');
    emotionalText = emotionalText.replace(/\!\s+/g, '! ');
    emotionalText = emotionalText.replace(/\?\s+/g, '? ');
    
    // Add brief pauses after commas
    emotionalText = emotionalText.replace(/,\s+/g, ', ');
    
    console.log('🎯 Voice Assistant: Original text:', text);
    console.log('🗣️ Voice Assistant: Speaking text:', emotionalText);
    
    return emotionalText;
  };

  const speakText = (text) => {
    if (!synthRef.current || !selectedVoice) {
      console.log('❌ Voice Assistant: Speech synthesis not ready');
      return;
    }
    
    if (!text || text.trim() === '') {
      console.log('❌ Voice Assistant: No text to speak');
      return;
    }
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    
    // Process the EXACT AI response text with emotional inflection
    const emotionalText = addEmotionalInflection(text);
    
    const utterance = new SpeechSynthesisUtterance(emotionalText);
    
    // Set the selected male voice
    utterance.voice = selectedVoice;
    
    // Optimize settings for clear, human-like speech
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 0.8; // Lower pitch for masculine voice
    utterance.volume = 0.9; // High volume for presence
    
    // Adjust speech parameters based on content emotion
    if (text.includes('!') || text.includes('amazing') || text.includes('excellent') || text.includes('great')) {
      // Excited/positive content
      utterance.rate = 0.9;
      utterance.pitch = 0.85;
      console.log('🎉 Voice Assistant: Using excited tone');
    } else if (text.includes('?')) {
      // Questions - more inquisitive
      utterance.pitch = 0.82;
      utterance.rate = 0.8;
      console.log('❓ Voice Assistant: Using questioning tone');
    } else if (text.includes('sorry') || text.includes('unfortunately') || text.includes('error')) {
      // Apologetic/concerned
      utterance.pitch = 0.75;
      utterance.rate = 0.75;
      console.log('😔 Voice Assistant: Using apologetic tone');
    } else {
      console.log('💬 Voice Assistant: Using normal tone');
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('🎤 Voice Assistant: Started speaking with voice:', selectedVoice?.name);
      console.log('📝 Voice Assistant: Speaking content:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('✅ Voice Assistant: Finished speaking');
      // Hide after speaking is done with a slight delay
      setTimeout(() => {
        setIsVisible(false);
        console.log('👋 Voice Assistant: Hidden');
      }, 1200);
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Voice Assistant: Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsVisible(false);
    };
    
    // Add progress tracking
    utterance.onboundary = (event) => {
      if (event.name === 'sentence') {
        console.log('📖 Voice Assistant: Speaking sentence at position:', event.charIndex);
      }
    };
    
    console.log('🚀 Voice Assistant: Starting speech synthesis...');
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsVisible(false);
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="voice-assistant-map-overlay">
      <div className="voice-assistant-map-container">
        {/* Main circular interface */}
        <div className={`voice-circle ${isSpeaking ? 'speaking' : ''}`}>
          <div className="voice-circle-inner">
            <div className="voice-icon speaking-icon" onClick={stopSpeaking}>
              👨‍💼
            </div>
          </div>
          
          {/* Animated rings */}
          <div className="voice-ring ring-1"></div>
          <div className="voice-ring ring-2"></div>
          <div className="voice-ring ring-3"></div>
        </div>

        {/* Status text */}
        <div className="voice-status">
          {isSpeaking ? 'AI Assistant Speaking...' : 'AI Response'}
        </div>

        {/* Voice info and stop button */}
        <div className="voice-controls">
          {selectedVoice && (
            <div className="voice-info">
              🎙️ ClimaTech AI
            </div>
          )}
          {isSpeaking && (
            <button className="voice-stop-btn" onClick={stopSpeaking}>
              🔇 Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant; 