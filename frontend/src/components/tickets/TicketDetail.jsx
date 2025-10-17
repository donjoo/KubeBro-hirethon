import React, { useState, useEffect } from 'react';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const TicketDetail = ({ ticketId, onBack }) => {
  const { currentTicket, isLoading, error, fetchTicket, updateTicketStatus, addComment } = useTickets();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    admin_feedback: '',
  });
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    }
  }, [ticketId]);

  const isAdmin = user.is_staff || user.is_superuser;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setIsSubmittingComment(true);
    
    const result = await addComment(ticketId, {
      content: newComment.trim(),
      is_internal: false,
    });
    
    if (result.success) {
      setNewComment('');
      logger.info('Comment added successfully', { ticketId });
    } else {
      logger.error('Comment submission failed', { error: result.error });
    }
    
    setIsSubmittingComment(false);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    const result = await updateTicketStatus(ticketId, statusUpdate);
    
    if (result.success) {
      setStatusUpdate({ status: '', admin_feedback: '' });
      setShowStatusUpdate(false);
      logger.info('Ticket status updated', { ticketId, status: statusUpdate.status });
    } else {
      logger.error('Status update failed', { error: result.error });
    }
  };

  if (isLoading) {
    return (
      <div className="ticket-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-detail-error">
        <p>Error loading ticket: {error}</p>
        <button onClick={onBack} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!currentTicket) {
    return (
      <div className="ticket-detail-not-found">
        <p>Ticket not found</p>
        <button onClick={onBack} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-detail-header">
        <button onClick={onBack} className="back-button">
          ← Back to Tickets
        </button>
        <div className="ticket-header-info">
          <h1>#{currentTicket.id} - {currentTicket.title}</h1>
          <div className="ticket-badges">
            {getStatusBadge(currentTicket.status)}
            {getPriorityBadge(currentTicket.priority)}
          </div>
        </div>
        {isAdmin && (
          <button 
            className="update-status-button"
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
          >
            Update Status
          </button>
        )}
      </div>

      {/* Status Update Form (Admin Only) */}
      {showStatusUpdate && isAdmin && (
        <div className="status-update-form">
          <h3>Update Ticket Status</h3>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="">Select Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_user">Pending User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="admin_feedback">Admin Feedback</label>
              <textarea
                id="admin_feedback"
                value={statusUpdate.admin_feedback}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, admin_feedback: e.target.value }))}
                placeholder="Add feedback or resolution notes..."
                rows="4"
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setShowStatusUpdate(false)}>
                Cancel
              </button>
              <button type="submit">Update Status</button>
            </div>
          </form>
        </div>
      )}

      <div className="ticket-detail-content">
        <div className="ticket-info">
          <div className="ticket-meta">
            <div className="meta-item">
              <strong>Created:</strong> {formatDate(currentTicket.created_at)}
            </div>
            <div className="meta-item">
              <strong>Category:</strong> {currentTicket.category.replace('_', ' ').toUpperCase()}
            </div>
            <div className="meta-item">
              <strong>Created by:</strong> {currentTicket.user.name || currentTicket.user.email}
            </div>
            {currentTicket.assigned_to && (
              <div className="meta-item">
                <strong>Assigned to:</strong> {currentTicket.assigned_to.name || currentTicket.assigned_to.email}
              </div>
            )}
            {currentTicket.resolved_at && (
              <div className="meta-item">
                <strong>Resolved:</strong> {formatDate(currentTicket.resolved_at)}
              </div>
            )}
          </div>

          <div className="ticket-description">
            <h3>Description</h3>
            <p>{currentTicket.description}</p>
          </div>

          {currentTicket.admin_feedback && (
            <div className="admin-feedback">
              <h3>Admin Feedback</h3>
              <p>{currentTicket.admin_feedback}</p>
            </div>
          )}
        </div>

        <div className="ticket-comments">
          <h3>Comments ({currentTicket.comments.length})</h3>
          
          <div className="comments-list">
            {currentTicket.comments.map((comment) => (
              <div key={comment.id} className={`comment ${comment.is_admin_comment ? 'admin-comment' : 'user-comment'}`}>
                <div className="comment-header">
                  <strong>{comment.author.name || comment.author.email}</strong>
                  {comment.is_admin_comment && <span className="admin-badge">Admin</span>}
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                </div>
                <div className="comment-content">
                  {comment.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCommentSubmit} className="add-comment-form">
            <div className="form-group">
              <label htmlFor="new-comment">Add Comment</label>
              <textarea
                id="new-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add your comment..."
                rows="3"
                disabled={isSubmittingComment}
              />
            </div>
            <button 
              type="submit" 
              disabled={!newComment.trim() || isSubmittingComment}
              className="submit-comment-button"
            >
              {isSubmittingComment ? 'Adding Comment...' : 'Add Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
