import React, { useEffect, useRef, useState, useCallback } from 'react'
import { askQuestion, BACKEND_URL } from '../lib/api.js'

const SNAP_POINTS = () => [96, Math.round(window.innerHeight * 0.5), Math.round(window.innerHeight * 0.85)]

export default function ChatPanel() {
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS()[0])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(null)
  const [startHeight, setStartHeight] = useState(null)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('climatech_chat_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const onResize = () => {
      const points = SNAP_POINTS()
      const nearest = closest(points, sheetHeight)
      setSheetHeight(nearest)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [sheetHeight])

  useEffect(() => {
    try {
      localStorage.setItem('climatech_chat_history', JSON.stringify(messages))
    } catch {}

    // Auto scroll to bottom on new message when expanded
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [messages])

  const onPointerMove = useCallback((e) => {
    if (!isDragging || dragStartY == null || startHeight == null) return
    
    e.preventDefault()
    const currentY = e.clientY || e.touches?.[0]?.clientY
    if (currentY == null) return
    
    const delta = dragStartY - currentY
    const nextHeight = Math.min(Math.max(startHeight + delta, SNAP_POINTS()[0]), SNAP_POINTS()[2])
    setSheetHeight(nextHeight)
  }, [isDragging, dragStartY, startHeight])

  const onPointerUp = useCallback(() => {
    if (!isDragging) return
    
    const points = SNAP_POINTS()
    setSheetHeight((h) => closest(points, h))
    setIsDragging(false)
    setDragStartY(null)
    setStartHeight(null)
    
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('touchend', onPointerUp)
  }, [isDragging, onPointerMove])

  const onPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const clientY = e.clientY || e.touches?.[0]?.clientY
    if (clientY == null) return
    
    setIsDragging(true)
    setDragStartY(clientY)
    setStartHeight(sheetHeight)
    
    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('touchmove', onPointerMove, { passive: false })
    document.addEventListener('touchend', onPointerUp)
  }

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const newMsgs = [...messages, { role: 'user', content: q, ts: Date.now() }]
    setMessages(newMsgs)
    setLoading(true)
    try {
      const res = await askQuestion(q)
      const a = typeof res?.answer === 'string' ? res.answer : 'Sorry, I could not get an answer.'
      setMessages((m) => [...m, { role: 'assistant', content: a, ts: Date.now() }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Request failed. Please try again.', ts: Date.now() }])
    } finally {
      setLoading(false)
      // Expand to mid-height to show response
      setSheetHeight(SNAP_POINTS()[1])
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div
      className={`chat-sheet ${isDragging ? 'dragging' : ''}`}
      style={{ height: sheetHeight }}
      aria-label="Chat with ClimaTech AI"
    >
      <div
        className="chat-grabber"
        onPointerDown={onPointerDown}
        onTouchStart={onPointerDown}
        role="button"
        aria-label="Drag to resize chat"
        style={{ touchAction: 'none' }}
      >
        <div className="grab-handle" />
        <div className="grab-title">Assistant</div>
        <div className="connection">{BACKEND_URL ? 'Online' : 'Offline'}</div>
      </div>

      <div ref={contentRef} className="chat-content">
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask about weather, hazards, power, evacuation routes and more.
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-msg ${m.role}`}>
            <div className="bubble">
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <div className="bubble typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Ask about the weather here…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}

function closest(points, value) {
  return points.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev))
} 