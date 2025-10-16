import React, { createContext, useContext, useReducer, useEffect } from 'react';
import logger from '../utils/logger';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial State
const initialState = {
  user: null,
  tokens: {
    access: null,
    refresh: null,
  },
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        tokens: { access: null, refresh: null },
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        tokens: { access: null, refresh: null },
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedTokens && storedUser) {
          const tokens = JSON.parse(storedTokens);
          const user = JSON.parse(storedUser);
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, tokens },
          });
        }
      } catch (error) {
        logger.error('Error initializing auth state', { error: error.message });
        // Clear invalid stored data
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      }
    };

    initializeAuth();
  }, []);

  // API Base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = state.tokens.access;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the request with new token
          config.headers.Authorization = `Bearer ${state.tokens.access}`;
          return fetch(`${API_BASE_URL}${url}`, config);
        } else {
          // Refresh failed, logout user
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }
      
      return response;
    } catch (error) {
      logger.error('API request error', { error: error.message, url });
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: state.tokens.refresh,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTokens = {
          access: data.access,
          refresh: state.tokens.refresh, // Keep the same refresh token
        };
        
        // Update tokens in state and localStorage
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: state.user, tokens: newTokens },
        });
        
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      return false;
    }
  };

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, tokens: data.tokens },
        });
        
        logger.info('User login successful', { email });
        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: data,
        });
        logger.warn('User login failed', { email, error: data });
        return { success: false, error: data };
      }
    } catch (error) {
      const errorData = { error: 'Network error. Please try again.' };
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorData,
      });
      logger.error('User login network error', { email, error: error.message });
      return { success: false, error: errorData };
    }
  };

  // Register function
  const register = async (email, name, password, passwordConfirm) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password, password_confirm: passwordConfirm }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user: data.user, tokens: data.tokens },
        });
        
        logger.info('User registration successful', { email, name });
        return { success: true, data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data,
        });
        logger.warn('User registration failed', { email, name, error: data });
        return { success: false, error: data };
      }
    } catch (error) {
      const errorData = { error: 'Network error. Please try again.' };
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorData,
      });
      logger.error('User registration network error', { email, name, error: error.message });
      return { success: false, error: errorData };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.tokens.refresh) {
        await makeAuthenticatedRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: state.tokens.refresh }),
        });
      }
    } catch (error) {
      logger.error('Logout error', { error: error.message });
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    makeAuthenticatedRequest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
