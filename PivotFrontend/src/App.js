import React from 'react';
import './App.css';
import MapComponent from './components/MapComponent';
import AISummaryPanel from './components/AISummaryPanel';
import BackendStatus from './components/BackendStatus';

function App() {
  return (
    <div className="App">
      <div className="split-container">
        <div className="map-section">
          <MapComponent />
        </div>
        <div className="ai-section">
          <div style={{ padding: 10 }}>
            <BackendStatus />
          </div>
          <AISummaryPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
