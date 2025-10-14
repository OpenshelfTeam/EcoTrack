import api from './api';

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
};
