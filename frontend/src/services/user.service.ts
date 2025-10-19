import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  role: 'resident' | 'collector' | 'operator' | 'authority' | 'admin';
  isActive: boolean;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    'in-app': boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const userService = {
  async getAllUsers(params?: any) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUser(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: any) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async updateProfile(id: string, data: any) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async updateUserRole(id: string, role: string) {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async activateUser(id: string) {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  },

  async deactivateUser(id: string) {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  },

  async getUserActivity(id: string) {
    const response = await api.get(`/users/${id}/activity`);
    return response.data;
  },
};
