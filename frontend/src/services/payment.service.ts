import api from './api';

export const paymentService = {
  async getAllPayments(params?: any) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async createPayment(data: any) {
    const response = await api.post('/payments', data);
    return response.data;
  },
};
