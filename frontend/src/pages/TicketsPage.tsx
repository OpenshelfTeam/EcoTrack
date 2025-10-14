import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Ticket } from 'lucide-react';

export const TicketsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Tickets & Issues"
      description="View and manage all tickets and issues. Track resolution status and communicate with residents."
      icon={<Ticket className="h-12 w-12 text-white" />}
    />
  );
};
