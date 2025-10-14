import React from 'react';
import { ComingSoonPage } from '../components/ComingSoonPage';
import { Users } from 'lucide-react';

export const UsersPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="User Management"
      description="Manage all system users. View, edit, and assign roles to residents, collectors, and administrators."
      icon={<Users className="h-12 w-12 text-white" />}
    />
  );
};
