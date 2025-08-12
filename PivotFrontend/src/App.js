import React from 'react';
import './App.css';
import MapComponent from './components/MapComponent';
import AISummaryPanel from './components/AISummaryPanel';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="App">
      <div className="split-container">
        <div className="chatbot-section">
          <ChatBot />
        </div>
        <div className="map-section">
          <MapComponent />
        </div>
        <div className="ai-section">
          <AISummaryPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
