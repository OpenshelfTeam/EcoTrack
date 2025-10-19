import api from './api';

export interface BinRequest {
  _id: string;
  requestId: string;
  resident: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: any;
  };
  requestedBinType: 'general' | 'recyclable' | 'organic' | 'hazardous';
  preferredDeliveryDate?: Date;
  address?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  assignedBin?: any;
  paymentVerified: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const binRequestService = {
  async createRequest(data: {
    requestedBinType: string;
    preferredDeliveryDate?: string;
    notes?: string;
    address?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }) {
    const response = await api.post('/bin-requests', data);
    return response.data;
  },

  async getRequests(params?: any) {
    const response = await api.get('/bin-requests', { params });
    return response.data;
  },

  async approveRequest(requestId: string, data: { binId?: string; deliveryDate?: string }) {
    const response = await api.post(`/bin-requests/${requestId}/approve`, data);
    return response.data;
  },

  async getMyRequests() {
    const response = await api.get('/bin-requests');
    return response.data;
  },

  async cancelRequest(requestId: string) {
    const response = await api.post(`/bin-requests/${requestId}/cancel`);
    return response.data;
  },

  async confirmReceipt(requestId: string) {
    const response = await api.post(`/bin-requests/${requestId}/confirm-receipt`);
    return response.data;
  }
};
