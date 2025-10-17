import React, { useState } from 'react';
import { TicketProvider, useTickets } from '../../contexts/TicketContext';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import CreateTicketForm from './CreateTicketForm';
import logger from '../../utils/logger';

const TicketManagerContent = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail'
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const handleTicketSelect = (ticketId) => {
    if (ticketId === 'create') {
      setCurrentView('create');
      setSelectedTicketId(null);
    } else {
      setCurrentView('detail');
      setSelectedTicketId(ticketId);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTicketId(null);
  };

  const handleTicketCreated = (ticket) => {
    logger.info('Ticket created, switching to detail view', { ticketId: ticket.id });
    setCurrentView('detail');
    setSelectedTicketId(ticket.id);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return (
          <CreateTicketForm
            onSuccess={handleTicketCreated}
            onCancel={handleBackToList}
          />
        );
      case 'detail':
        return (
          <TicketDetail
            ticketId={selectedTicketId}
            onBack={handleBackToList}
          />
        );
      default:
        return (
          <TicketList
            onTicketSelect={handleTicketSelect}
            showCreateButton={true}
          />
        );
    }
  };

  return (
    <div className="ticket-manager">
      <div className="ticket-manager-header">
        <h1>Support Tickets</h1>
        <p>Manage your support requests and track their progress</p>
      </div>
      
      <div className="ticket-manager-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

const TicketManager = () => {
  return (
    <TicketProvider>
      <TicketManagerContent />
    </TicketProvider>
  );
};

export default TicketManager;
