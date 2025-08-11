import React, { useState, useEffect, useRef } from 'react'

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isProfileOpen])

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark">🌎</span>
          <span className="brand-name">ClimaTech AI</span>
        </div>
        <div className="header-actions">
          <a className="link" href="https://github.com/" target="_blank" rel="noreferrer">Docs</a>
          <div className="user-profile" ref={profileRef}>
            <button 
              className="profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="User profile"
            >
              <div className="profile-avatar">
                <span className="profile-icon">👤</span>
              </div>
            </button>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-name">User</div>
                  <div className="profile-email">user@climatech.ai</div>
                </div>
                <div className="profile-divider" />
                <button className="profile-menu-item">Settings</button>
                <button className="profile-menu-item">Help</button>
                <button className="profile-menu-item">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 