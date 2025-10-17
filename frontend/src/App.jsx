import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthModal from './components/auth/AuthModal'
import UserProfile from './components/UserProfile'
import TicketManager from './components/tickets/TicketManager'
import logger from './utils/logger'
import './App.css'

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'tickets'

  const handleAuthSuccess = (data) => {
    logger.info('Authentication successful', { user: data.user?.email })
    setIsAuthModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>KubeBro Hirethon</h1>
        <nav className="app-nav">
          {isAuthenticated ? (
            <div className="nav-items">
              <div className="nav-links">
                <button 
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className={`nav-link ${currentView === 'tickets' ? 'active' : ''}`}
                  onClick={() => setCurrentView('tickets')}
                >
                  Support Tickets
                </button>
              </div>
              <UserProfile />
            </div>
          ) : (
            <button 
              className="auth-button"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Login / Sign Up
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {isAuthenticated ? (
          <>
            {currentView === 'dashboard' && (
              <div className="dashboard">
                <h2>Welcome to your Dashboard!</h2>
                <p>You are successfully authenticated.</p>
                <div className="dashboard-content">
                  <div className="card">
                    <h3>User Information</h3>
                    <p>Email: {user.email}</p>
                    <p>Name: {user.name || 'Not provided'}</p>
                    <p>Member since: {new Date(user.date_joined).toLocaleDateString()}</p>
                  </div>
                  <div className="card">
                    <h3>Quick Actions</h3>
                    <p>Get started by creating a support ticket or managing your existing ones.</p>
                    <button 
                      className="cta-button"
                      onClick={() => setCurrentView('tickets')}
                    >
                      Go to Support Tickets
                    </button>
                  </div>
                </div>
              </div>
            )}
            {currentView === 'tickets' && <TicketManager />}
          </>
        ) : (
          <div className="welcome">
            <h2>Welcome to KubeBro Hirethon</h2>
            <p>Please login or create an account to access the application.</p>
            <button 
              className="cta-button"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Get Started
            </button>
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
