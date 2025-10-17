import React, { useState } from 'react';
import { useTickets } from '../../contexts/TicketContext';
import logger from '../../utils/logger';

const CreateTicketForm = ({ onSuccess, onCancel }) => {
  const { createTicket, isLoading } = useTickets();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'support',
    priority: 'medium',
  });
  const [validationErrors, setValidationErrors] = useState({});

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
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await createTicket(formData);
    
    if (result.success) {
      logger.info('Ticket created successfully', { ticketId: result.data.id });
      if (onSuccess) {
        onSuccess(result.data);
      }
    } else {
      logger.error('Ticket creation failed', { error: result.error });
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName];
  };

  return (
    <div className="create-ticket-form">
      <div className="form-header">
        <h2>Create New Ticket</h2>
        <p>Describe your issue or request in detail so we can help you effectively.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={getFieldError('title') ? 'error' : ''}
            placeholder="Brief description of your issue"
            disabled={isLoading}
          />
          {getFieldError('title') && (
            <div className="error-message">{getFieldError('title')}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={getFieldError('description') ? 'error' : ''}
            placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable"
            rows="6"
            disabled={isLoading}
          />
          {getFieldError('description') && (
            <div className="error-message">{getFieldError('description')}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="support">Technical Support</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="billing">Billing Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Ticket...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicketForm;
