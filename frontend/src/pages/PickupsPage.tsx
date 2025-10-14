import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Calendar } from 'lucide-react';

export const PickupsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Pickup Schedule"
      description="View your upcoming waste collection schedule. Get notifications and track pickup status in real-time."
      icon={<Calendar className="h-12 w-12 text-white" />}
    />
  );
};
