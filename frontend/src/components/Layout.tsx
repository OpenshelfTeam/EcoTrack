import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
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
        { name: 'Collections', icon: Trash2, path: '/collections' },
      ];
    }

    if (user?.role === 'authority' || user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Analytics', icon: BarChart3, path: '/analytics' },
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
        { name: 'Users', icon: User, path: '/users' },
        { name: 'Routes', icon: Truck, path: '/routes' },
        { name: 'Payments', icon: CreditCard, path: '/payments' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="ml-2 text-xl font-bold text-green-600">EcoTrack</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative">
              <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
