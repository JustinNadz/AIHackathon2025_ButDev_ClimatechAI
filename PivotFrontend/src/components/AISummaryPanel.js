import React from 'react';
import './AISummaryPanel.css';

const AISummaryPanel = () => {
  return (
    <div className="ai-summary-panel">
      <div className="ai-header">
        <h2>AI Map Analysis</h2>
        <p>AI-generated summary will appear here</p>
      </div>
      <div className="ai-content">
        <div className="placeholder-content">
          <div className="placeholder-icon">🤖</div>
          <h3>AI Analysis Panel</h3>
          <p>This area is reserved for AI-generated map analysis and insights.</p>
          <p>The AI will provide summaries and analysis of the selected map area.</p>
        </div>
      </div>
    </div>
  );
};

export default AISummaryPanel;
