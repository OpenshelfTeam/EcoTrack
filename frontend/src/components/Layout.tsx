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

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        { name: 'Notifications', icon: Bell, path: '/notifications' },
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
      <header className="bg-white/70 backdrop-blur-xl shadow-lg fixed w-full top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Animated Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-emerald-600 lg:hidden p-2 hover:bg-emerald-50 rounded-xl transition-all duration-300 transform hover:scale-110"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? 
                <X className="h-6 w-6 animate-fadeIn" /> : 
                <Menu className="h-6 w-6 animate-fadeIn" />
              }
            </button>
            
            {/* Logo with 3D Effect and Animation */}
            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                <div className="relative h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                  <Trash2 className="h-5 w-5 text-white drop-shadow-md" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent transform transition-transform duration-300 hover:scale-105">
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
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-200 to-teal-200 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
              <Bell className="h-6 w-6 text-gray-600 group-hover:text-emerald-600 transition-colors duration-300" />
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg animate-pulse border border-white">
                3
              </span>
            </Link>
            
            {/* User Profile and Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <div className="text-right hidden sm:block">
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
                <span className="absolute inset-0 rounded-xl bg-red-100 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></span>
                <LogOut className="h-5 w-5 relative z-10" />
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
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        
        <div className="h-full overflow-y-auto pt-3">
          {/* User Profile Section */}
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl p-4 border border-emerald-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  {/* Avatar with glowing border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-30"></div>
                  <div className="relative h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-inner">
                    <span className="text-lg font-bold text-emerald-700">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="px-4">
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider ml-2 mb-2">Main Navigation</h3>
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
                    <span className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    
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
                    <div className="flex-1 flex flex-col">
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
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse mr-1"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Enhanced Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-gray-100/50">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm relative overflow-hidden">
              {/* Decorative background patterns */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-teal-200/20 rounded-full blur-lg"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-100 rounded-md">
                    <MessageSquare className="h-4 w-4 text-emerald-700" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">Need assistance?</h4>
                </div>
                <p className="text-xs text-emerald-700 mb-3">Our support team is ready to help you with any questions</p>
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
        <div className="p-5 sm:p-7 lg:p-10 max-w-7xl mx-auto">
          {/* Background decoration */}
          <div className="fixed top-[20%] right-[5%] w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
          <div className="fixed bottom-[10%] left-[10%] w-80 h-80 bg-cyan-100/20 rounded-full blur-3xl -z-10"></div>
          
          {/* Animated content container */}
          <div className="relative animate-fadeIn">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="mt-16 border-t border-gray-100 pt-5 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">EcoTrack</span> © {new Date().getFullYear()}
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
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-20 lg:hidden transition-all duration-500 animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
