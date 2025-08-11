import React from 'react'
import Header from './components/Header.jsx'
import MapView from './components/MapView.jsx'
import ChatPanel from './components/ChatPanel.jsx'

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="main-content">
        <MapView />
      </main>
      <ChatPanel />
    </div>
  )
} 