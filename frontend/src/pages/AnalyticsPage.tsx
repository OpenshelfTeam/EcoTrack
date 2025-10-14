import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { BarChart3 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Analytics & Reports"
      description="Comprehensive analytics dashboard with charts, graphs, and detailed reports on waste management operations."
      icon={<BarChart3 className="h-12 w-12 text-white" />}
    />
  );
};
