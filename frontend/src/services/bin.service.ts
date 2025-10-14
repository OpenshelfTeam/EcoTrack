import api from './api';

export interface SmartBin {
  _id: string;
  binId: string;
  qrCode?: string;
  rfidTag?: string;
  assignedTo?: any;
  location: {
    type: string;
    coordinates: number[];
    address?: string;
  };
  capacity: number;
  currentLevel: number;
  binType: string;
  status: string;
  lastEmptied?: Date;
  deliveryDate?: Date;
  activationDate?: Date;
}

export const binService = {
  async getAllBins(params?: any) {
    const response = await api.get('/smart-bins', { params });
    return response.data;
  },

  async getBin(id: string) {
    const response = await api.get(`/smart-bins/${id}`);
    return response.data;
  },

  async createBin(data: any) {
    const response = await api.post('/smart-bins', data);
    return response.data;
  },

  async updateBin(id: string, data: any) {
    const response = await api.put(`/smart-bins/${id}`, data);
    return response.data;
  },

  async deleteBin(id: string) {
    const response = await api.delete(`/smart-bins/${id}`);
    return response.data;
  },

  async assignBin(binId: string, userId: string) {
    const response = await api.post(`/smart-bins/${binId}/assign`, { userId });
    return response.data;
  },
};
