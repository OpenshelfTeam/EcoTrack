import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, Truck, AlertCircle, DollarSign, TrendingUp, ArrowUp, 
  ArrowDown, Clock, Calendar, MapPin, Bell, BarChart3,
  ChevronRight, CheckCircle, Users, Map, Leaf
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animation, setAnimation] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Initial loading animation
  useEffect(() => {
    setAnimation(true);
  }, []);

  // Format date for header
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Enhanced stat card with animations and 3D effects
  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, bgGradient, delay = 0 }: any) => (
    <div 
      className={`group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 hover:scale-[1.02] ${bgGradient} p-7 animate-fadeIn`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-black/5 blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
      <div className="absolute -top-10 -left-10 h-16 w-16 rounded-full bg-white/10 opacity-50 group-hover:scale-150 group-hover:opacity-70 transition-all duration-1000"></div>
      
      {/* Card content with 3D effect */}
      <div className="relative z-10 transition-transform duration-500 transform group-hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-5">
          <div className={`p-3.5 rounded-2xl ${color} bg-white/20 backdrop-blur-md shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 border border-white/10`}>
            <Icon className="h-7 w-7 text-white drop-shadow-md" />
          </div>
          {trend !== null && trend !== undefined && (
            <div className={`flex items-center gap-1.5 ${trend >= 0 ? 'text-green-100' : 'text-red-100'} text-sm font-medium px-3 py-1.5 rounded-full ${trend >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} backdrop-blur-sm transition-all duration-300 group-hover:scale-110`}>
              {trend > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <div className="transition-all duration-500 transform group-hover:translate-x-1">
          <p className="text-white/80 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-4xl font-bold text-white mb-2">{value}</h3>
          {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-10">
        {/* Ultra-Modern Welcome Section with 3D elements and animations */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-0 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25)]">
          {/* Animated background patterns */}
          <div className="absolute inset-0 w-full h-full">
            <svg className="absolute w-full h-full opacity-20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" opacity="0.2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Floating orbs */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl animate-float"></div>
          <div className="absolute bottom-1/3 right-1/3 h-24 w-24 rounded-full bg-yellow-200/10 blur-2xl animate-float-delayed"></div>
          
          {/* Content with glass effect */}
          <div className="relative z-10 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Welcome message */}
              <div className="lg:col-span-7 animate-slideInFromLeft">
                <div className="mb-1 inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-white">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
                  Welcome back, {user?.firstName}! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                </h1>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20 shadow-inner">
                  <p className="text-white/90 text-lg">
                    {user?.role === 'resident' && 'Manage your waste collection and track your bins efficiently'}
                    {user?.role === 'collector' && 'View your assigned routes and record collections'}
                    {user?.role === 'authority' && 'Monitor operations and manage tickets'}
                    {user?.role === 'operator' && 'Manage bins, users, and system operations'}
                  </p>
                </div>
                
                {/* Stats summary */}
                <div className="flex gap-4 mt-5">
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/20">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">System Status</p>
                        <p className="text-sm font-bold text-white">Operational</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/20">
                        <Leaf className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Environmental Impact</p>
                        <p className="text-sm font-bold text-white">+24% Better</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dashboard summary and time */}
              <div className="lg:col-span-5 animate-slideInFromRight">
                <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-inner h-full">
                  {/* Current time */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Current Time</p>
                      <p className="text-xl font-bold text-white">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  {/* User role summary */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Role</p>
                      <p className="text-xl font-bold text-white capitalize">{user?.role}</p>
                    </div>
                  </div>
                  
                  {/* Location data */}
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Service Area</p>
                      <p className="text-xl font-bold text-white">Downtown District</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative bottom wave */}
          <div className="absolute bottom-0 w-full">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 text-gray-50 opacity-50">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0H1000V36.02C808.71,76.17,621.82,99.88,321.39,56.44Z" className="fill-current"></path>
            </svg>
          </div>
        </div>

        {/* Section heading with animated underline */}
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800 inline-block">
            Dashboard Overview
            <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-emerald-500 to-teal-500 mt-1 animate-expand-width"></div>
          </h2>
        </div>
        
        {/* Stats Grid - Resident */}
        {user?.role === 'resident' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Trash2}
              title="Active Bins"
              value="2"
              subtitle="All bins assigned"
              color="text-emerald-600"
              bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              trend={0}
              delay={100}
            />
            <StatCard
              icon={Truck}
              title="Next Pickup"
              value="Tomorrow"
              subtitle="10:00 AM - 12:00 PM"
              color="text-blue-600"
              bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              trend={null}
              delay={200}
            />
            <StatCard
              icon={AlertCircle}
              title="Open Tickets"
              value="1"
              subtitle="View details"
              color="text-orange-600"
              bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
              trend={null}
              delay={300}
            />
            <StatCard
              icon={DollarSign}
              title="Payment Due"
              value="$25"
              subtitle="Due in 5 days"
              color="text-purple-600"
              bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
              trend={null}
              delay={400}
            />
          </div>
        )}

        {/* Stats Grid - Collector */}
        {user?.role === 'collector' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Truck}
              title="Routes Today"
              value="3"
              subtitle="2 completed"
              color="text-blue-600"
              bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              trend={null}
              delay={100}
            />
            <StatCard
              icon={Trash2}
              title="Collections"
              value="45"
              subtitle="Today"
              color="text-emerald-600"
              bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              trend={12}
              delay={200}
            />
            <StatCard
              icon={AlertCircle}
              title="Exceptions"
              value="2"
              subtitle="Need attention"
              color="text-orange-600"
              bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
              trend={-25}
              delay={300}
            />
            <StatCard
              icon={TrendingUp}
              title="Completion"
              value="89%"
              subtitle="This week"
              color="text-purple-600"
              bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
              trend={5}
              delay={400}
            />
          </div>
        )}

        {/* Stats Grid - Authority/Operator */}
        {(user?.role === 'authority' || user?.role === 'operator' || user?.role === 'admin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Trash2}
              title="Total Bins"
              value="450"
              subtitle="405 active"
              color="text-emerald-600"
              bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              trend={3}
              delay={100}
            />
            <StatCard
              icon={Truck}
              title="Collections"
              value="128"
              subtitle="Today"
              color="text-blue-600"
              bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              trend={8}
              delay={200}
            />
            <StatCard
              icon={AlertCircle}
              title="Open Tickets"
              value="15"
              subtitle="5 high priority"
              color="text-orange-600"
              bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
              trend={-10}
              delay={300}
            />
            <StatCard
              icon={TrendingUp}
              title="Efficiency"
              value="94%"
              subtitle="+2% from last week"
              color="text-purple-600"
              bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
              trend={2}
              delay={400}
            />
          </div>
        )}

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                <span className="p-1 rounded-lg bg-gradient-to-r from-teal-100 to-emerald-100 shadow-inner">
                  <Bell className="h-5 w-5 text-emerald-600" />
                </span>
                Recent Activity
              </h2>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium px-4 py-2 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5">
              {[
                { icon: Trash2, title: 'Waste collection completed', desc: 'Route #1 - Collected 45 bins', time: '2 hours ago', color: 'bg-emerald-500', colorLight: 'bg-emerald-100' },
                { icon: Truck, title: 'Route assigned', desc: 'New route for tomorrow morning', time: '4 hours ago', color: 'bg-blue-500', colorLight: 'bg-blue-100' },
                { icon: AlertCircle, title: 'Ticket resolved', desc: 'Missed collection issue fixed', time: '6 hours ago', color: 'bg-orange-500', colorLight: 'bg-orange-100' },
                { icon: DollarSign, title: 'Payment received', desc: 'Invoice #1234 - $25.00', time: '1 day ago', color: 'bg-purple-500', colorLight: 'bg-purple-100' },
              ].map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={i} 
                    className="group flex items-start gap-4 p-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fadeIn"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className={`relative p-3 ${activity.colorLight} rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                      <div className={`absolute inset-0 ${activity.color} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 rounded-full`}></div>
                      <Icon className={`h-6 w-6 relative z-10 ${activity.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0 transform transition-transform duration-300 group-hover:translate-x-1">
                      <p className="font-semibold text-gray-900 mb-1.5 text-lg">{activity.title}</p>
                      <p className="text-sm text-gray-600 mb-3">{activity.desc}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium px-2.5 py-1 rounded-full bg-gray-100 w-fit">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2 mb-8">
              <span className="p-1 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 shadow-inner">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </span>
              Quick Actions
            </h2>
            <div className="space-y-4">
              {user?.role === 'resident' && [
                { icon: Truck, label: 'Schedule Pickup', color: 'from-blue-500 to-indigo-600', desc: 'Plan your next waste collection' },
                { icon: Trash2, label: 'Report Issue', color: 'from-orange-500 to-red-600', desc: 'Report problems with bins or service' },
                { icon: DollarSign, label: 'View Bills', color: 'from-purple-500 to-pink-600', desc: 'Check payment history & dues' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    className={`group w-full flex items-center gap-4 p-5 bg-gradient-to-r ${action.color} text-white rounded-2xl hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] transition-all duration-500 transform hover:translate-y-[-2px] hover:scale-[1.01] relative overflow-hidden animate-fadeIn`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></span>
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-lg block">{action.label}</span>
                      <span className="text-xs text-white/80">{action.desc}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                );
              })}
              
              {user?.role === 'collector' && [
                { icon: Truck, label: 'Start Route', color: 'from-blue-500 to-indigo-600', desc: 'Begin your collection journey' },
                { icon: Trash2, label: 'Record Collection', color: 'from-emerald-500 to-teal-600', desc: 'Log completed bin collections' },
                { icon: AlertCircle, label: 'Report Exception', color: 'from-orange-500 to-red-600', desc: 'Report issues encountered' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    className={`group w-full flex items-center gap-4 p-5 bg-gradient-to-r ${action.color} text-white rounded-2xl hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] transition-all duration-500 transform hover:translate-y-[-2px] hover:scale-[1.01] relative overflow-hidden animate-fadeIn`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></span>
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-lg block">{action.label}</span>
                      <span className="text-xs text-white/80">{action.desc}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                );
              })}

              {(user?.role === 'authority' || user?.role === 'operator' || user?.role === 'admin') && [
                { icon: BarChart3, label: 'View Analytics', color: 'from-purple-500 to-pink-600', desc: 'Review system performance metrics' },
                { icon: AlertCircle, label: 'Manage Tickets', color: 'from-orange-500 to-red-600', desc: 'Handle resident complaints & issues' },
                { icon: Trash2, label: 'Monitor Bins', color: 'from-emerald-500 to-teal-600', desc: 'Check bin status & locations' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    className={`group w-full flex items-center gap-4 p-5 bg-gradient-to-r ${action.color} text-white rounded-2xl hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] transition-all duration-500 transform hover:translate-y-[-2px] hover:scale-[1.01] relative overflow-hidden animate-fadeIn`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></span>
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-lg block">{action.label}</span>
                      <span className="text-xs text-white/80">{action.desc}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
