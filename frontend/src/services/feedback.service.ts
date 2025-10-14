import api from './api';

export const feedbackService = {
  async getAllFeedback() {
    const response = await api.get('/feedback');
    return response.data;
  },

  async createFeedback(data: any) {
    const response = await api.post('/feedback', data);
    return response.data;
  },
};
