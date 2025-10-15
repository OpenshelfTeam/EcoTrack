import api from './api';

export interface Payment {
  _id: string;
  invoiceId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'online';
  paymentDate?: Date;
  dueDate: Date;
  description: string;
  items: PaymentItem[];
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const paymentService = {
  async getAllPayments(params?: any) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async getPayment(id: string) {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  async createPayment(data: any) {
    const response = await api.post('/payments', data);
    return response.data;
  },

  async updatePayment(id: string, data: any) {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  async deletePayment(id: string) {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  async updatePaymentStatus(id: string, status: string, paymentMethod?: string) {
    const response = await api.patch(`/payments/${id}/status`, { status, paymentMethod });
    return response.data;
  },

  async generateInvoice(id: string) {
    const response = await api.post(`/payments/${id}/invoice`);
    return response.data;
  },

  async downloadInvoice(id: string) {
    const response = await api.get(`/payments/${id}/invoice/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getPaymentStats() {
    const response = await api.get('/payments/stats');
    return response.data;
  },

  async getUserPayments(userId: string) {
    const response = await api.get(`/payments/user/${userId}`);
    return response.data;
  },
};
