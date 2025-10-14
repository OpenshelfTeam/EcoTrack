import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Truck } from 'lucide-react';

export const RoutesPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Collection Routes"
      description="Plan and optimize waste collection routes. Assign collectors and track route completion in real-time."
      icon={<Truck className="h-12 w-12 text-white" />}
    />
  );
};
