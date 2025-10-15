import api from './api';

export interface Notification {
  _id: string;
  recipient: string;
  type: 'pickup-scheduled' | 'pickup-reminder' | 'pickup-completed' | 'bin-delivered' | 
        'bin-activated' | 'payment-due' | 'payment-received' | 'payment-failed' | 
        'ticket-update' | 'ticket-resolved' | 'system-alert' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: Array<'in-app' | 'email' | 'sms' | 'push'>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  relatedEntity?: {
    entityType: 'route' | 'bin' | 'payment' | 'ticket' | 'collection' | 'user';
    entityId: string;
  };
  metadata?: {
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
  };
  readAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  'in-app': boolean;
}

export const notificationService = {
  async getNotifications(params?: any) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async getNotification(id: string) {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  async createNotification(data: any) {
    const response = await api.post('/notifications', data);
    return response.data;
  },

  async updateNotification(id: string, data: any) {
    const response = await api.put(`/notifications/${id}`, data);
    return response.data;
  },

  async deleteNotification(id: string) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async deleteReadNotifications() {
    const response = await api.delete('/notifications/read');
    return response.data;
  },

  async getNotificationPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  async updateNotificationPreferences(preferences: NotificationPreferences) {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  async sendBulkNotification(data: any) {
    const response = await api.post('/notifications/bulk', data);
    return response.data;
  },

  async getNotificationStats() {
    const response = await api.get('/notifications/stats');
    return response.data;
  },
};
