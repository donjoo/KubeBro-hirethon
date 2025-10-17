import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

// Ticket Context
const TicketContext = createContext();

// Ticket Actions
const TICKET_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_TICKETS: 'SET_TICKETS',
  ADD_TICKET: 'ADD_TICKET',
  UPDATE_TICKET: 'UPDATE_TICKET',
  SET_CURRENT_TICKET: 'SET_CURRENT_TICKET',
  ADD_COMMENT: 'ADD_COMMENT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial State
const initialState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  error: null,
};

// Ticket Reducer
const ticketReducer = (state, action) => {
  switch (action.type) {
    case TICKET_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case TICKET_ACTIONS.SET_TICKETS:
      return {
        ...state,
        tickets: action.payload,
        isLoading: false,
      };
    
    case TICKET_ACTIONS.ADD_TICKET:
      return {
        ...state,
        tickets: [action.payload, ...state.tickets],
        isLoading: false,
      };
    
    case TICKET_ACTIONS.UPDATE_TICKET:
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id === action.payload.id ? action.payload : ticket
        ),
        currentTicket: state.currentTicket?.id === action.payload.id 
          ? action.payload 
          : state.currentTicket,
      };
    
    case TICKET_ACTIONS.SET_CURRENT_TICKET:
      return {
        ...state,
        currentTicket: action.payload,
        isLoading: false,
      };
    
    case TICKET_ACTIONS.ADD_COMMENT:
      if (state.currentTicket && state.currentTicket.id === action.payload.ticket_id) {
        return {
          ...state,
          currentTicket: {
            ...state.currentTicket,
            comments: [...state.currentTicket.comments, action.payload],
          },
        };
      }
      return state;
    
    case TICKET_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case TICKET_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Ticket Provider Component
export const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ticketReducer, initialState);
  const { makeAuthenticatedRequest } = useAuth();

  // Helper function to make API requests
  const makeRequest = async (url, options = {}) => {
    try {
      const response = await makeAuthenticatedRequest(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Ticket API request error', { error: error.message, url });
      throw error;
    }
  };

  // Fetch all tickets
  const fetchTickets = async (filters = {}) => {
    dispatch({ type: TICKET_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `/tickets/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const data = await makeRequest(url);
      dispatch({ type: TICKET_ACTIONS.SET_TICKETS, payload: data.results || data });
      
      logger.info('Tickets fetched successfully', { count: data.results?.length || data.length });
    } catch (error) {
      dispatch({ type: TICKET_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Fetch single ticket
  const fetchTicket = async (ticketId) => {
    dispatch({ type: TICKET_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const data = await makeRequest(`/tickets/${ticketId}/`);
      dispatch({ type: TICKET_ACTIONS.SET_CURRENT_TICKET, payload: data });
      
      logger.info('Ticket fetched successfully', { ticketId });
    } catch (error) {
      dispatch({ type: TICKET_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Create new ticket
  const createTicket = async (ticketData) => {
    dispatch({ type: TICKET_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const data = await makeRequest('/tickets/', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
      
      dispatch({ type: TICKET_ACTIONS.ADD_TICKET, payload: data });
      
      logger.info('Ticket created successfully', { ticketId: data.id, title: data.title });
      return { success: true, data };
    } catch (error) {
      dispatch({ type: TICKET_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update ticket
  const updateTicket = async (ticketId, updateData) => {
    try {
      const data = await makeRequest(`/tickets/${ticketId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      dispatch({ type: TICKET_ACTIONS.UPDATE_TICKET, payload: data });
      
      logger.info('Ticket updated successfully', { ticketId, updates: Object.keys(updateData) });
      return { success: true, data };
    } catch (error) {
      logger.error('Ticket update failed', { ticketId, error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update ticket status (admin only)
  const updateTicketStatus = async (ticketId, statusData) => {
    try {
      const data = await makeRequest(`/tickets/${ticketId}/update_status/`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      });
      
      dispatch({ type: TICKET_ACTIONS.UPDATE_TICKET, payload: data });
      
      logger.info('Ticket status updated', { ticketId, status: statusData.status });
      return { success: true, data };
    } catch (error) {
      logger.error('Ticket status update failed', { ticketId, error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Add comment to ticket
  const addComment = async (ticketId, commentData) => {
    try {
      const data = await makeRequest(`/tickets/${ticketId}/add_comment/`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      });
      
      dispatch({ type: TICKET_ACTIONS.ADD_COMMENT, payload: { ...data, ticket_id: ticketId } });
      
      logger.info('Comment added successfully', { ticketId, commentId: data.id });
      return { success: true, data };
    } catch (error) {
      logger.error('Comment addition failed', { ticketId, error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Get my tickets
  const getMyTickets = async () => {
    dispatch({ type: TICKET_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const data = await makeRequest('/tickets/my_tickets/');
      dispatch({ type: TICKET_ACTIONS.SET_TICKETS, payload: data });
      
      logger.info('My tickets fetched successfully', { count: data.length });
    } catch (error) {
      dispatch({ type: TICKET_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Get assigned tickets (admin only)
  const getAssignedTickets = async () => {
    dispatch({ type: TICKET_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const data = await makeRequest('/tickets/assigned_to_me/');
      dispatch({ type: TICKET_ACTIONS.SET_TICKETS, payload: data });
      
      logger.info('Assigned tickets fetched successfully', { count: data.length });
    } catch (error) {
      dispatch({ type: TICKET_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Get ticket statistics (admin only)
  const getTicketStats = async () => {
    try {
      const data = await makeRequest('/tickets/stats/');
      return { success: true, data };
    } catch (error) {
      logger.error('Ticket stats fetch failed', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: TICKET_ACTIONS.CLEAR_ERROR });
  };

  // Clear current ticket
  const clearCurrentTicket = () => {
    dispatch({ type: TICKET_ACTIONS.SET_CURRENT_TICKET, payload: null });
  };

  const value = {
    ...state,
    fetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    updateTicketStatus,
    addComment,
    getMyTickets,
    getAssignedTickets,
    getTicketStats,
    clearError,
    clearCurrentTicket,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};

// Custom hook to use ticket context
export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

export default TicketContext;
