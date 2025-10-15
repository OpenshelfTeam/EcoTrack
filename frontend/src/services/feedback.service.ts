import api from './api';

export interface Feedback {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  category: 'service' | 'collection' | 'bin' | 'payment' | 'app' | 'other';
  subject: string;
  message: string;
  rating: number;
  status: 'pending' | 'responded' | 'resolved';
  response?: string;
  respondedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  respondedAt?: Date;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const feedbackService = {
  async getAllFeedback(params?: any) {
    const response = await api.get('/feedback', { params });
    return response.data;
  },

  async getFeedback(id: string) {
    const response = await api.get(`/feedback/${id}`);
    return response.data;
  },

  async createFeedback(data: any) {
    const response = await api.post('/feedback', data);
    return response.data;
  },

  async updateFeedback(id: string, data: any) {
    const response = await api.put(`/feedback/${id}`, data);
    return response.data;
  },

  async deleteFeedback(id: string) {
    const response = await api.delete(`/feedback/${id}`);
    return response.data;
  },

  async respondToFeedback(id: string, response: string) {
    const res = await api.post(`/feedback/${id}/respond`, { response });
    return res.data;
  },

  async updateFeedbackStatus(id: string, status: string) {
    const response = await api.patch(`/feedback/${id}/status`, { status });
    return response.data;
  },

  async getFeedbackStats() {
    const response = await api.get('/feedback/stats');
    return response.data;
  },
};
