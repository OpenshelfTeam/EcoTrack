import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { MessageSquare } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Feedback & Surveys"
      description="Collect and analyze feedback from residents. View survey results and service quality metrics."
      icon={<MessageSquare className="h-12 w-12 text-white" />}
    />
  );
};
