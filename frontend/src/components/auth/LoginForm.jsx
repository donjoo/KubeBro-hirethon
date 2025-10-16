import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const LoginForm = ({ onSuccess, onSwitchToSignup }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
    setValidationErrors({});
  }, [formData, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      logger.info('Login form submission successful', { email: formData.email });
      if (onSuccess) {
        onSuccess(result.data);
      }
    } else {
      logger.warn('Login form submission failed', { email: formData.email, error: result.error });
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || (error && error[fieldName]);
  };

  const getGeneralError = () => {
    if (error && typeof error === 'object') {
      // Check for general error message
      if (error.error) return error.error;
      if (error.detail) return error.detail;
      if (error.message) return error.message;
      
      // Check for non-field specific errors
      const fieldErrors = Object.keys(error).filter(key => 
        !['email', 'password', 'name', 'password_confirm'].includes(key)
      );
      if (fieldErrors.length > 0) {
        return error[fieldErrors[0]];
      }
    }
    return null;
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Login</h2>
        
        {getGeneralError() && (
          <div className="error-message general-error">
            {Array.isArray(getGeneralError()) 
              ? getGeneralError().join(', ') 
              : getGeneralError()
            }
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={getFieldError('email') ? 'error' : ''}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {getFieldError('email') && (
              <div className="error-message">
                {Array.isArray(getFieldError('email')) 
                  ? getFieldError('email').join(', ') 
                  : getFieldError('email')
                }
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={getFieldError('password') ? 'error' : ''}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {getFieldError('password') && (
              <div className="error-message">
                {Array.isArray(getFieldError('password')) 
                  ? getFieldError('password').join(', ') 
                  : getFieldError('password')
                }
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToSignup}
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
