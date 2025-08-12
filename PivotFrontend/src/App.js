import React, { useState } from 'react';
import './App.css';
import MapComponent from './components/MapComponent';
import AISummaryPanel from './components/AISummaryPanel';
import VoiceAssistant from './components/VoiceAssistant';

function App() {
  const [lastChatMessage, setLastChatMessage] = useState(null);

  return (
    <div className="App">
      <div className="split-container">
        <div className="map-section">
          <MapComponent />
          <VoiceAssistant lastChatMessage={lastChatMessage} />
        </div>
        <div className="ai-section">
          <AISummaryPanel 
            onLastMessageChange={setLastChatMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
