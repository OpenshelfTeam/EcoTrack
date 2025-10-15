import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  BarChart3, Package, Recycle,
  DollarSign, Users, Calendar, Download, ArrowUp, ArrowDown,
  Activity, PieChart, MapPin, Clock
} from 'lucide-react';
import { analyticsService } from '../services/analytics.service';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState({ 
    startDate: '', 
    endDate: '' 
  });

  // Fetch analytics data with React Query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.getDashboardStats()
  });

  const { data: wasteData, isLoading: wasteLoading } = useQuery({
    queryKey: ['waste-statistics', dateRange],
    queryFn: () => analyticsService.getWasteStatistics({
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      groupBy: 'month'
    })
  });

  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['efficiency-metrics'],
    queryFn: () => analyticsService.getEfficiencyMetrics()
  });

  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financial-analytics'],
    queryFn: () => analyticsService.getFinancialAnalytics()
  });

  const { data: areaData } = useQuery({
    queryKey: ['area-statistics'],
    queryFn: () => analyticsService.getAreaStatistics()
  });

  const { data: engagementData } = useQuery({
    queryKey: ['engagement-statistics'],
    queryFn: () => analyticsService.getEngagementStatistics()
  });

  const isLoading = dashboardLoading || wasteLoading || efficiencyLoading || financialLoading;

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract data with fallbacks
  const stats = dashboardData?.data || {
    bins: { total: 0, active: 0, needingCollection: 0 },
    collections: { total: 0, today: 0 },
    pickups: { total: 0, pending: 0 },
    tickets: { total: 0, open: 0 },
    revenue: { total: 0, monthly: 0 },
    routes: { active: 0 },
    users: { total: 0 }
  };
  const wasteStats = wasteData?.data || [];
  const efficiency = efficiencyData?.data || {};
  const financial = financialData?.data || {};
  const areas = areaData?.data || [];
  const engagement = engagementData?.data || {};

  const handleExport = async (type: 'collections' | 'pickups' | 'payments') => {
    try {
      await analyticsService.exportAnalytics(type, dateRange.startDate, dateRange.endDate);
      alert(`${type} data exported successfully!`);
    } catch (error: any) {
      alert('Failed to export data: ' + (error.response?.data?.message || error.message));
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, suffix = '' }: any) => {
    const isPositive = change > 0;
    const changeColor = isPositive ? 'text-emerald-600' : 'text-red-600';
    const changeBgColor = isPositive ? 'bg-emerald-50' : 'bg-red-50';

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
            <Icon className="w-6 h-6" />
          </div>
          <div className={`px-2 py-1 rounded-lg ${changeBgColor} flex items-center gap-1`}>
            {isPositive ? <ArrowUp className={`w-4 h-4 ${changeColor}`} /> : <ArrowDown className={`w-4 h-4 ${changeColor}`} />}
            <span className={`text-xs font-semibold ${changeColor}`}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}{suffix}
        </p>
        <p className="text-xs text-gray-500 mt-2">vs previous {timeRange}</p>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <BarChart3 className="w-7 h-7" />
              </div>
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={() => alert('Export report functionality')}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Bins"
            value={stats.bins?.total || 0}
            change={5.2}
            icon={Package}
          />
          <StatCard
            title="Active Bins"
            value={stats.bins?.active || 0}
            change={3.1}
            icon={Recycle}
          />
          <StatCard
            title="Total Revenue"
            value={stats.revenue?.total || 0}
            change={12.4}
            icon={DollarSign}
            suffix=" USD"
          />
          <StatCard
            title="Total Users"
            value={stats.users?.total || 0}
            change={5.8}
            icon={Users}
          />
          <StatCard
            title="Completed Collections"
            value={stats.collections?.total || 0}
            change={6.7}
            icon={Calendar}
          />
          <StatCard
            title="Pending Pickups"
            value={stats.pickups?.pending || 0}
            change={-2.3}
            icon={Clock}
          />
        </div>

        {/* Waste Statistics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-6 h-6" />
              Waste Statistics
            </h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waste Data */}
            <div className="space-y-4">
              {wasteStats.length > 0 ? (
                wasteStats.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Period {index + 1}</span>
                      <span className="text-emerald-600 font-semibold">{item.totalAmount || 0} kg</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No waste statistics available</p>
                </div>
              )}
            </div>

            {/* Pie Chart Placeholder */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
              <div className="text-center">
                <PieChart className="w-24 h-24 text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Visual Pie Chart</p>
                <p className="text-sm text-gray-500 mt-2">Integrate chart library like Chart.js or Recharts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Efficiency Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Collection Rate</p>
              <p className="text-3xl font-bold text-emerald-600">
                {efficiency.collectionRate || 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">On-Time Delivery</p>
              <p className="text-3xl font-bold text-blue-600">
                {efficiency.onTimeDelivery || 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">User Satisfaction</p>
              <p className="text-3xl font-bold text-purple-600">
                {efficiency.userSatisfaction || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Area Statistics & Financial Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Statistics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Area Statistics
            </h2>
            <div className="space-y-4">
              {areas.length > 0 ? (
                areas.map((area: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{area.name || `Area ${index + 1}`}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Collections</p>
                        <p className="font-bold text-gray-900">{area.collections || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bins</p>
                        <p className="font-bold text-gray-900">{area.bins || 0}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No area statistics available</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Analytics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Financial Overview
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${financial.monthlyRevenue || stats.revenue?.monthly || 0}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${financial.totalRevenue || stats.revenue?.total || 0}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Revenue Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Collections</span>
                    <span className="font-semibold">${financial.collections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickups</span>
                    <span className="font-semibold">${financial.pickups || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penalties</span>
                    <span className="font-semibold">${financial.penalties || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Statistics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            User Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.activeUsers || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Logins</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.totalLogins || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Feedback Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.feedbackCount || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tickets?.open || 0}</p>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Download className="w-6 h-6" />
            Export Analytics
          </h2>
          <p className="text-emerald-100 mb-6">
            Export data for the selected date range: {dateRange.startDate || 'All time'} to {dateRange.endDate || 'Now'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleExport('collections')}
              className="bg-white text-emerald-600 rounded-lg p-4 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Export Collections
            </button>
            <button
              onClick={() => handleExport('pickups')}
              className="bg-white text-emerald-600 rounded-lg p-4 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Export Pickups
            </button>
            <button
              onClick={() => handleExport('payments')}
              className="bg-white text-emerald-600 rounded-lg p-4 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Export Payments
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
