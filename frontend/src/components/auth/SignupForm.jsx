import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const SignupForm = ({ onSuccess, onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
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
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else {
      // Additional password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(formData.password)) {
        errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
    }
    
    if (!formData.passwordConfirm) {
      errors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await register(
      formData.email,
      formData.name,
      formData.password,
      formData.passwordConfirm
    );
    
    if (result.success) {
      logger.info('Signup form submission successful', { email: formData.email, name: formData.name });
      if (onSuccess) {
        onSuccess(result.data);
      }
    } else {
      logger.warn('Signup form submission failed', { email: formData.email, name: formData.name, error: result.error });
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
        <h2>Sign Up</h2>
        
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
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={getFieldError('name') ? 'error' : ''}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {getFieldError('name') && (
              <div className="error-message">
                {Array.isArray(getFieldError('name')) 
                  ? getFieldError('name').join(', ') 
                  : getFieldError('name')
                }
              </div>
            )}
          </div>

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

          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={getFieldError('passwordConfirm') ? 'error' : ''}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {getFieldError('passwordConfirm') && (
              <div className="error-message">
                {Array.isArray(getFieldError('passwordConfirm')) 
                  ? getFieldError('passwordConfirm').join(', ') 
                  : getFieldError('passwordConfirm')
                }
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
