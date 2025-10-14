import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Truck, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="mt-2 text-green-100">
            {user?.role === 'resident' && 'Manage your waste collection and track your bins'}
            {user?.role === 'collector' && 'View your assigned routes and record collections'}
            {user?.role === 'authority' && 'Monitor operations and manage tickets'}
            {user?.role === 'operator' && 'Manage bins, users, and system operations'}
          </p>
        </div>

        {/* Stats Grid */}
        {user?.role === 'resident' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Trash2}
              title="Active Bins"
              value="2"
              subtitle="All bins assigned"
              color="bg-green-500"
            />
            <StatCard
              icon={Truck}
              title="Next Pickup"
              value="Tomorrow"
              subtitle="10:00 AM - 12:00 PM"
              color="bg-blue-500"
            />
            <StatCard
              icon={AlertCircle}
              title="Open Tickets"
              value="1"
              subtitle="View details"
              color="bg-orange-500"
            />
            <StatCard
              icon={DollarSign}
              title="Payment Due"
              value="$25"
              subtitle="Due in 5 days"
              color="bg-purple-500"
            />
          </div>
        )}

        {user?.role === 'collector' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Truck}
              title="Routes Today"
              value="3"
              subtitle="2 completed"
              color="bg-blue-500"
            />
            <StatCard
              icon={Trash2}
              title="Collections"
              value="45"
              subtitle="Today"
              color="bg-green-500"
            />
            <StatCard
              icon={AlertCircle}
              title="Exceptions"
              value="2"
              subtitle="Need attention"
              color="bg-orange-500"
            />
            <StatCard
              icon={TrendingUp}
              title="Completion"
              value="89%"
              subtitle="This week"
              color="bg-purple-500"
            />
          </div>
        )}

        {(user?.role === 'authority' || user?.role === 'operator' || user?.role === 'admin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Trash2}
              title="Total Bins"
              value="450"
              subtitle="405 active"
              color="bg-green-500"
            />
            <StatCard
              icon={Truck}
              title="Collections"
              value="128"
              subtitle="Today"
              color="bg-blue-500"
            />
            <StatCard
              icon={AlertCircle}
              title="Open Tickets"
              value="15"
              subtitle="5 high priority"
              color="bg-orange-500"
            />
            <StatCard
              icon={TrendingUp}
              title="Efficiency"
              value="94%"
              subtitle="+2% from last week"
              color="bg-purple-500"
            />
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trash2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Waste collection completed</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Route #{i + 1} - Collected 45 bins
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
