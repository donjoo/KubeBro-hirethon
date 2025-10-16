import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  const handleAuthSuccess = (data) => {
    console.log('Authentication successful:', data);
    if (onAuthSuccess) {
      onAuthSuccess(data);
    }
    onClose();
  };

  const handleSwitchToSignup = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {isLogin ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={handleSwitchToSignup}
            />
          ) : (
            <SignupForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
