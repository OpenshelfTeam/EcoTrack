import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  BarChart3, TrendingUp, TrendingDown, Package, Recycle,
  DollarSign, Users, Calendar, Download, ArrowUp, ArrowDown,
  Activity, PieChart, MapPin, Clock
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  // Mock analytics data
  const stats = {
    totalWasteCollected: 12450,
    wasteChange: 8.5,
    recyclingRate: 62.3,
    recyclingChange: 3.2,
    totalRevenue: 45680,
    revenueChange: 12.4,
    activeUsers: 1250,
    userChange: 5.8,
    completedCollections: 458,
    collectionChange: 6.7,
    averageResponseTime: 2.4,
    responseChange: -15.3
  };

  const wasteByType = [
    { type: 'General Waste', amount: 5450, percentage: 43.8, color: 'bg-gray-500' },
    { type: 'Recyclables', amount: 3890, percentage: 31.2, color: 'bg-emerald-500' },
    { type: 'Organic Waste', amount: 2110, percentage: 16.9, color: 'bg-green-500' },
    { type: 'Hazardous Waste', amount: 680, percentage: 5.5, color: 'bg-red-500' },
    { type: 'Bulk Items', amount: 320, percentage: 2.6, color: 'bg-orange-500' }
  ];

  const collectionTrends = [
    { month: 'Apr', collections: 420, waste: 11200 },
    { month: 'May', collections: 435, waste: 11500 },
    { month: 'Jun', collections: 448, waste: 11800 },
    { month: 'Jul', collections: 442, waste: 11950 },
    { month: 'Aug', collections: 455, waste: 12180 },
    { month: 'Sep', collections: 458, waste: 12450 }
  ];

  const areaPerformance = [
    { area: 'Downtown', collections: 125, waste: 3450, efficiency: 92 },
    { area: 'Suburbs', collections: 158, waste: 4230, efficiency: 88 },
    { area: 'Industrial', collections: 89, waste: 2890, efficiency: 95 },
    { area: 'East Side', collections: 86, waste: 1880, efficiency: 90 }
  ];

  const topCollectors = [
    { name: 'John Smith', collections: 145, efficiency: 96, rating: 4.9 },
    { name: 'Mike Johnson', collections: 138, efficiency: 94, rating: 4.8 },
    { name: 'Sarah Williams', collections: 132, efficiency: 95, rating: 4.7 },
    { name: 'David Brown', collections: 128, efficiency: 92, rating: 4.6 },
    { name: 'Lisa Anderson', collections: 115, efficiency: 91, rating: 4.5 }
  ];

  const recentIssues = [
    { type: 'Missed Collection', count: 12, trend: -25 },
    { type: 'Damaged Bins', count: 8, trend: 10 },
    { type: 'Service Delays', count: 15, trend: -15 },
    { type: 'Customer Complaints', count: 6, trend: -40 }
  ];

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
            title="Total Waste Collected"
            value={stats.totalWasteCollected}
            change={stats.wasteChange}
            icon={Package}
            suffix=" kg"
          />
          <StatCard
            title="Recycling Rate"
            value={stats.recyclingRate}
            change={stats.recyclingChange}
            icon={Recycle}
            suffix="%"
          />
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            change={stats.revenueChange}
            icon={DollarSign}
            suffix=" USD"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            change={stats.userChange}
            icon={Users}
          />
          <StatCard
            title="Completed Collections"
            value={stats.completedCollections}
            change={stats.collectionChange}
            icon={Calendar}
          />
          <StatCard
            title="Avg Response Time"
            value={stats.averageResponseTime}
            change={stats.responseChange}
            icon={Clock}
            suffix=" hrs"
          />
        </div>

        {/* Waste Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-6 h-6" />
              Waste Distribution by Type
            </h2>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="all">All Areas</option>
              <option value="downtown">Downtown</option>
              <option value="suburbs">Suburbs</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="space-y-4">
              {wasteByType.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{item.type}</span>
                    <span className="text-gray-600">{item.amount.toLocaleString()} kg ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
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

        {/* Collection Trends */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Collection Trends
          </h2>
          
          {/* Line Chart Placeholder */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-64 border-b border-l border-gray-200 p-4">
              {collectionTrends.map((item) => {
                const maxWaste = Math.max(...collectionTrends.map(t => t.waste));
                const height = (item.waste / maxWaste) * 100;
                
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center relative group">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-600 rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.waste.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{item.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-sm text-gray-500">
              Monthly waste collection volume (kg)
            </div>
          </div>
        </div>

        {/* Area Performance & Top Collectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Performance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Area Performance
            </h2>
            <div className="space-y-4">
              {areaPerformance.map((area) => (
                <div key={area.area} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{area.area}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      area.efficiency >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {area.efficiency}% efficiency
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Collections</p>
                      <p className="font-bold text-gray-900">{area.collections}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Waste Collected</p>
                      <p className="font-bold text-gray-900">{area.waste.toLocaleString()} kg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Collectors */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Top Performers
            </h2>
            <div className="space-y-4">
              {topCollectors.map((collector, index) => (
                <div key={collector.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{collector.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      <span>{collector.collections} collections</span>
                      <span>{collector.efficiency}% efficiency</span>
                      <span>⭐ {collector.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Issues Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Issue Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentIssues.map((issue) => (
              <div key={issue.type} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700 text-sm">{issue.type}</h3>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    issue.trend < 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {issue.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {Math.abs(issue.trend)}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{issue.count}</p>
                <p className="text-xs text-gray-500 mt-1">This {timeRange}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Quick Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-emerald-100 text-sm">Peak Collection Time</p>
              <p className="text-2xl font-bold mt-1">6:00 AM - 9:00 AM</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-emerald-100 text-sm">Most Active Area</p>
              <p className="text-2xl font-bold mt-1">Suburbs</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-emerald-100 text-sm">Customer Satisfaction</p>
              <p className="text-2xl font-bold mt-1">4.7 / 5.0 ⭐</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
