import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  Bell, CheckCircle, X, Calendar, Package, AlertCircle,
  MessageSquare, DollarSign, Settings, Trash2, Check, Filter, Loader2
} from 'lucide-react';
import { notificationService } from '../services/notification.service';

export const NotificationsPage = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const queryClient = useQueryClient();

  // Initialize preferences state BEFORE any conditional returns
  const [preferences, setPreferences] = useState({ 
    email: true, sms: true, push: true, 'in-app': true, 
    collections: true, payments: true, tickets: true, 
    system: true, pickups: true, feedback: false 
  });

  // Queries
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', filterType, filterRead],
    queryFn: () => notificationService.getNotifications({
      type: filterType !== 'all' ? filterType : undefined,
      unreadOnly: filterRead === 'unread' ? true : undefined
    })
  });

  const { data: preferencesData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationService.getNotificationPreferences
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      alert('Notification marked as read!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to mark as read');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      alert('All notifications marked as read!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to mark all as read');
    }
  });

  const deleteReadMutation = useMutation({
    mutationFn: notificationService.deleteReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      alert('Read notifications deleted!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete notifications');
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: notificationService.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      alert('Preferences updated successfully!');
      setShowSettings(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update preferences');
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load notifications</p>
          </div>
        </div>
      </Layout>
    );
  }

  const notifications = notificationsData?.data || [];

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteRead = () => {
    if (confirm('Delete all read notifications?')) {
      deleteReadMutation.mutate();
    }
  };

  const handleUpdatePreferences = () => {
    const apiPrefs = { email: preferences.email, sms: preferences.sms, push: preferences.push, 'in-app': preferences['in-app'] };
    updatePreferencesMutation.mutate(apiPrefs);
  };

  // Filter notifications (already handled by API, but keep for UI consistency)
  const filteredNotifications = notifications.filter((notification: any) => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'unread' && !notification.readAt) ||
                       (filterRead === 'read' && notification.readAt);
    return matchesType && matchesRead;
  });

  // Statistics
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n: any) => !n.read).length,
    today: notifications.filter((n: any) => {
      const notifDate = new Date(n.timestamp);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length,
    high: notifications.filter((n: any) => n.priority === 'high' && !n.read).length
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collection': return <Package className="w-5 h-5" />;
      case 'payment': return <DollarSign className="w-5 h-5" />;
      case 'ticket': return <MessageSquare className="w-5 h-5" />;
      case 'system': return <Settings className="w-5 h-5" />;
      case 'pickup': return <Package className="w-5 h-5" />;
      case 'feedback': return <MessageSquare className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'collection': return 'bg-blue-100 text-blue-600';
      case 'payment': return 'bg-emerald-100 text-emerald-600';
      case 'ticket': return 'bg-purple-100 text-purple-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      case 'pickup': return 'bg-orange-100 text-orange-600';
      case 'feedback': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'normal': return 'border-l-4 border-blue-500';
      case 'low': return 'border-l-4 border-gray-300';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };



  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <Bell className="w-7 h-7" />
              </div>
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">Stay updated with your waste management activities</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Preferences
            </button>
            {stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <CheckCircle className="w-5 h-5" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.unread}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.today}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.high}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                  showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteRead}
                  className="px-4 py-2.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Read
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="collection">Collections</option>
                  <option value="payment">Payments</option>
                  <option value="ticket">Tickets</option>
                  <option value="system">System</option>
                  <option value="pickup">Pickups</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterRead}
                  onChange={(e) => setFilterRead(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification: any) => (
            <div
              key={notification._id}
              className={`bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden ${
                !notification.readAt ? 'bg-blue-50 border-blue-200' : ''
              } ${getPriorityColor(notification.priority)}`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.readAt && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.readAt && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => notificationService.deleteNotification(notification._id).then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(notification.sentAt || notification.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        notification.priority === 'urgent' || notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                        notification.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.priority}
                      </span>
                      <span className="capitalize">{notification.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">
              {filterRead === 'unread' ? 'You have no unread notifications' : 
               filterType !== 'all' ? 'Try adjusting your filters' :
               'You have no notifications at this time'}
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email}
                      onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600">Receive push notifications in the app</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.push}
                      onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications via text message</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.sms}
                      onChange={(e) => setPreferences({ ...preferences, sms: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Collection Updates</p>
                        <p className="text-sm text-gray-600">Schedule and completion notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.collections}
                      onChange={(e) => setPreferences({ ...preferences, collections: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment Reminders</p>
                        <p className="text-sm text-gray-600">Billing and payment notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.payments}
                      onChange={(e) => setPreferences({ ...preferences, payments: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Ticket Updates</p>
                        <p className="text-sm text-gray-600">Support ticket responses</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.tickets}
                      onChange={(e) => setPreferences({ ...preferences, tickets: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">System Alerts</p>
                        <p className="text-sm text-gray-600">Maintenance and updates</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.system}
                      onChange={(e) => setPreferences({ ...preferences, system: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pickup Requests</p>
                        <p className="text-sm text-gray-600">Special pickup notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.pickups}
                      onChange={(e) => setPreferences({ ...preferences, pickups: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Feedback Requests</p>
                        <p className="text-sm text-gray-600">Service feedback reminders</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.feedback}
                      onChange={(e) => setPreferences({ ...preferences, feedback: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Preferences saved successfully!');
                  setShowSettings(false);
                }}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
