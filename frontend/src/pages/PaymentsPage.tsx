import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { CreditCard } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Payments & Billing"
      description="Manage payment transactions, view billing history, and generate invoices for waste collection services."
      icon={<CreditCard className="h-12 w-12 text-white" />}
    />
  );
};
