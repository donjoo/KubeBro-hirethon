import React, { useState, useEffect } from 'react';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const TicketList = ({ onTicketSelect, showCreateButton = true }) => {
  const { tickets, isLoading, error, getMyTickets, getAssignedTickets, clearError } = useTickets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-tickets');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    clearError();
    if (activeTab === 'my-tickets') {
      await getMyTickets();
    } else if (activeTab === 'assigned' && (user.is_staff || user.is_superuser)) {
      await getAssignedTickets();
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    // Apply filters to tickets (you could also make API calls with filters)
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { class: 'status-open', text: 'Open' },
      in_progress: { class: 'status-in-progress', text: 'In Progress' },
      pending_user: { class: 'status-pending', text: 'Pending User' },
      resolved: { class: 'status-resolved', text: 'Resolved' },
      closed: { class: 'status-closed', text: 'Closed' },
    };
    
    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { class: 'priority-low', text: 'Low' },
      medium: { class: 'priority-medium', text: 'Medium' },
      high: { class: 'priority-high', text: 'High' },
      urgent: { class: 'priority-urgent', text: 'Urgent' },
    };
    
    const config = priorityConfig[priority] || { class: 'priority-default', text: priority };
    return <span className={`priority-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="ticket-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-list-error">
        <p>Error loading tickets: {error}</p>
        <button onClick={loadTickets} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      <div className="ticket-list-header">
        <h2>Support Tickets</h2>
        {showCreateButton && (
          <button 
            className="create-ticket-button"
            onClick={() => onTicketSelect && onTicketSelect('create')}
          >
            Create New Ticket
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="ticket-tabs">
        <button
          className={`tab-button ${activeTab === 'my-tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-tickets')}
        >
          My Tickets ({tickets.filter(t => activeTab === 'my-tickets').length})
        </button>
        {(user.is_staff || user.is_superuser) && (
          <button
            className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned to Me
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="ticket-filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_user">Pending User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing Issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Ticket List */}
      <div className="ticket-items">
        {tickets.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets found.</p>
            {showCreateButton && (
              <button 
                className="create-first-ticket-button"
                onClick={() => onTicketSelect && onTicketSelect('create')}
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="ticket-item"
              onClick={() => onTicketSelect && onTicketSelect(ticket.id)}
            >
              <div className="ticket-item-header">
                <div className="ticket-title-section">
                  <h3 className="ticket-title">#{ticket.id} - {ticket.title}</h3>
                  <div className="ticket-badges">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
                <div className="ticket-meta">
                  <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                </div>
              </div>

              <div className="ticket-item-body">
                <p className="ticket-category">
                  <strong>Category:</strong> {ticket.category.replace('_', ' ').toUpperCase()}
                </p>
                {ticket.assigned_to && (
                  <p className="ticket-assigned">
                    <strong>Assigned to:</strong> {ticket.assigned_to.name || ticket.assigned_to.email}
                  </p>
                )}
                {ticket.latest_comment && (
                  <p className="ticket-latest-comment">
                    <strong>Latest:</strong> {ticket.latest_comment.content}
                  </p>
                )}
              </div>

              <div className="ticket-item-footer">
                <span className="ticket-comment-count">
                  {ticket.comment_count} comment{ticket.comment_count !== 1 ? 's' : ''}
                </span>
                <span className="ticket-arrow">→</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TicketList;
