import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthModal from './components/auth/AuthModal'
import UserProfile from './components/UserProfile'
import logger from './utils/logger'
import './App.css'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

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
            <UserProfile />
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
          <div className="dashboard">
            <h2>Welcome to your Dashboard!</h2>
            <p>You are successfully authenticated.</p>
            <div className="dashboard-content">
              <div className="card">
                <h3>User Information</h3>
                <p>This is a protected area that only authenticated users can see.</p>
              </div>
            </div>
          </div>
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
