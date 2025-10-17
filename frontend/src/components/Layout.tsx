import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  Trash2,
  Truck,
  Ticket,
  CreditCard,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Package,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getNotifications({ limit: 1 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notificationsData?.unreadCount || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: Home, path: '/dashboard' },
      { name: 'Profile', icon: User, path: '/profile' },
    ];

    if (user?.role === 'resident') {
      return [
        ...baseItems,
        { name: 'My Bins', icon: Trash2, path: '/bins' },
        { name: 'Bin Requests', icon: Package, path: '/bin-requests' },
        { name: 'Deliveries', icon: Truck, path: '/deliveries' },
        { name: 'Pickups', icon: Truck, path: '/pickups' },
        { name: 'Tickets', icon: Ticket, path: '/tickets' },
        { name: 'Payments', icon: CreditCard, path: '/payments' },
        { name: 'Subscription', icon: CreditCard, path: '/subscription' },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback' },
      ];
    }

    if (user?.role === 'collector') {
      return [
        ...baseItems,
        { name: 'My Routes', icon: Truck, path: '/routes' },
        { name: 'Map', icon: Map, path: '/map' },
        { name: 'Collections', icon: Trash2, path: '/collections' },
      ];
    }

    if (user?.role === 'authority' || user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Analytics', icon: BarChart3, path: '/analytics' },
        { name: 'Users', icon: Users, path: '/users' },
        { name: 'Payments', icon: CreditCard, path: '/payments' },
        { name: 'Tickets', icon: Ticket, path: '/tickets' },
        { name: 'Collections', icon: Truck, path: '/collections' },
        { name: 'Bins', icon: Trash2, path: '/bins' },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback' },
      ];
    }

    if (user?.role === 'operator') {
      return [
        ...baseItems,
        { name: 'Bins', icon: Trash2, path: '/bins' },
        { name: 'Bin Requests', icon: Package, path: '/bin-requests' },
        { name: 'Deliveries', icon: Truck, path: '/deliveries' },
        { name: 'Users', icon: User, path: '/users' },
        { name: 'Routes', icon: Truck, path: '/routes' },
        { name: 'Payments', icon: CreditCard, path: '/payments' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-bgPulse">
      {/* Modernized Header with Glass Effect */}
      <header className="fixed top-0 z-40 w-full border-b border-gray-100 shadow-lg bg-white/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            {/* Animated Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 transition-all duration-300 transform hover:text-emerald-600 lg:hidden hover:bg-emerald-50 rounded-xl hover:scale-110"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? 
                <X className="w-6 h-6 animate-fadeIn" /> : 
                <Menu className="w-6 h-6 animate-fadeIn" />
              }
            </button>
            
            {/* Logo with 3D Effect and Animation */}
            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                <div className="relative flex items-center justify-center w-10 h-10 transition duration-300 transform shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl group-hover:scale-110">
                  <Trash2 className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-transparent transition-transform duration-300 transform bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text hover:scale-105">
                EcoTrack
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell with Advanced Animation */}
            <Link 
              to="/notifications" 
              className="relative p-2.5 hover:bg-emerald-50 rounded-xl transition-all duration-300 group transform hover:scale-110"
              aria-label="Notifications"
            >
              <span className="absolute inset-0 transition-opacity duration-300 opacity-0 rounded-xl bg-gradient-to-r from-emerald-200 to-teal-200 group-hover:opacity-30"></span>
              <Bell className="w-6 h-6 text-gray-600 transition-colors duration-300 group-hover:text-emerald-600" />
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-semibold text-white border border-white rounded-full shadow-lg -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            
            {/* User Profile and Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="h-2.5 w-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></span>
                  <p className="text-xs font-medium text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Logout Button */}
              <button
                onClick={handleLogout}
                className="relative p-2.5 text-gray-600 hover:text-red-600 rounded-xl transition-all duration-300 transform hover:scale-110 group"
                title="Logout"
                aria-label="Logout"
              >
                <span className="absolute inset-0 transition-opacity duration-300 bg-red-100 opacity-0 rounded-xl group-hover:opacity-70"></span>
                <LogOut className="relative z-10 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Ultra Modern Sidebar with Glassmorphism and 3D Effects */}
      <aside
        className={`fixed left-0 top-[61px] h-[calc(100vh-61px)] bg-white/70 backdrop-blur-xl shadow-[5px_0_30px_-15px_rgba(0,0,0,0.1)] border-r border-gray-100/50 transform transition-all duration-500 ease-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-72`}
      >
        {/* Decorative top gradient line */}
        <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        
        <div className="h-full pt-3 overflow-y-auto">
          {/* User Profile Section */}
          <div className="px-6 mb-6">
            <div className="p-4 border bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl border-emerald-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  {/* Avatar with glowing border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-30"></div>
                  <div className="relative flex items-center justify-center w-12 h-12 border-2 border-white rounded-full shadow-inner bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-lg font-bold text-emerald-700">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="px-4">
            <h3 className="mb-2 ml-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Main Navigation</h3>
            <nav className="space-y-1.5">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background shine effect on hover */}
                    <span className="absolute inset-0 w-full h-full transition-transform duration-700 transform -translate-x-full bg-white/20 group-hover:translate-x-full"></span>
                    
                    {/* Icon with dynamic container */}
                    <div className={`
                      flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 
                      ${isActive ? 
                        'bg-white/20' : 
                        'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                      }
                    `}>
                      <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    </div>
                    
                    {/* Label with animation */}
                    <div className="flex flex-col flex-1">
                      <span className={`font-medium transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                        {item.name}
                      </span>
                      {isActive && (
                        <span className="text-xs text-white/80 mt-0.5">
                          Current page
                        </span>
                      )}
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="w-2 h-2 mr-1 bg-white rounded-full animate-pulse"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Enhanced Sidebar Footer */}
          <div className="p-4 mt-auto border-t border-gray-100/50">
            <div className="relative p-5 overflow-hidden border shadow-sm bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-emerald-100/50">
              {/* Decorative background patterns */}
              <div className="absolute w-24 h-24 rounded-full -top-12 -right-12 bg-emerald-200/20 blur-xl"></div>
              <div className="absolute w-16 h-16 rounded-full -bottom-8 -left-8 bg-teal-200/20 blur-lg"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-100 rounded-md">
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">Need assistance?</h4>
                </div>
                <p className="mb-3 text-xs text-emerald-700">Our support team is ready to help you with any questions</p>
                <button className="w-full flex items-center justify-center gap-1.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow">
                  Contact Support
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Enhanced Main Content */}
      <main className="lg:ml-72 pt-[61px] min-h-screen">
        <div className="p-5 mx-auto sm:p-7 lg:p-10 max-w-7xl">
          {/* Background decoration */}
          <div className="fixed top-[20%] right-[5%] w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
          <div className="fixed bottom-[10%] left-[10%] w-80 h-80 bg-cyan-100/20 rounded-full blur-3xl -z-10"></div>
          
          {/* Animated content container */}
          <div className="relative animate-fadeIn">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="pt-5 pb-8 mt-16 border-t border-gray-100">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-lg h-7 w-7 bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  <span className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">EcoTrack</span> © {new Date().getFullYear()}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                Smart waste management for a cleaner tomorrow
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Enhanced Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 transition-all duration-500 bg-black/40 backdrop-blur-md lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
