import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Trash2 } from 'lucide-react';

export const BinsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Smart Bins Management"
      description="Manage and monitor all smart bins in the system. Track fill levels, locations, and maintenance schedules."
      icon={<Trash2 className="h-12 w-12 text-white" />}
    />
  );
};
