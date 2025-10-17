import api from './api';

export interface Delivery {
  _id: string;
  deliveryId: string;
  bin: any;
  resident: any;
  scheduledDate?: Date;
  trackingNumber: string;
  status: 'scheduled' | 'in-transit' | 'delivered' | 'failed' | 'rescheduled';
  deliveryTeam?: any;
  attempts: Array<{
    date: Date;
    note: string;
    performedBy: any;
  }>;
  verificationCode?: string;
  confirmedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const deliveryService = {
  async createDelivery(data: {
    binId: string;
    residentId?: string;
    scheduledDate?: string;
  }) {
    const response = await api.post('/deliveries', data);
    return response.data;
  },

  async getDeliveries() {
    const response = await api.get('/deliveries');
    return response.data;
  },

  async updateStatus(deliveryId: string, data: { status: string; note?: string }) {
    const response = await api.patch(`/deliveries/${deliveryId}/status`, data);
    return response.data;
  },

  async confirmReceipt(deliveryId: string) {
    const response = await api.post(`/deliveries/${deliveryId}/confirm`);
    return response.data;
  }
};
