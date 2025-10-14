import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Notifications Center"
      description="Manage all your notifications in one place. Stay updated on collection schedules, tickets, and system alerts."
      icon={<Bell className="h-12 w-12 text-white" />}
    />
  );
};
