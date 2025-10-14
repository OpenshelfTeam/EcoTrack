import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Package } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Collection Records"
      description="View detailed records of all waste collections. Track collection times, volumes, and exceptions."
      icon={<Package className="h-12 w-12 text-white" />}
    />
  );
};
