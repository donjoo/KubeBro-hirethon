import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

const UserProfile = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      logger.info('User logged out successfully', { email: user.email });
    } catch (error) {
      logger.error('Logout error in UserProfile', { error: error.message });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <h3>Welcome, {user.name || user.email}!</h3>
        <p>Email: {user.email}</p>
        <p>Member since: {new Date(user.date_joined).toLocaleDateString()}</p>
      </div>
      
      <div className="user-actions">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
