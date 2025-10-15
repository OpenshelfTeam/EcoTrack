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

export interface BinStats {
  total: number;
  active: number;
  inactive: number;
  needsCollection: number;
  avgFillLevel: number;
  byType: Record<string, number>;
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
    const response = await api.patch(`/smart-bins/${binId}/assign`, { userId });
    return response.data;
  },

  async activateBin(binId: string) {
    const response = await api.patch(`/smart-bins/${binId}/activate`);
    return response.data;
  },

  async updateBinLevel(binId: string, level: number) {
    const response = await api.patch(`/smart-bins/${binId}/level`, { currentLevel: level });
    return response.data;
  },

  async emptyBin(binId: string, collectorId?: string) {
    const response = await api.patch(`/smart-bins/${binId}/empty`, { collectorId });
    return response.data;
  },

  async addMaintenance(binId: string, data: any) {
    const response = await api.post(`/smart-bins/${binId}/maintenance`, data);
    return response.data;
  },

  async getBinStats() {
    const response = await api.get('/smart-bins/stats');
    return response.data;
  },

  async getNearbyBins(longitude: number, latitude: number, maxDistance: number = 5000) {
    const response = await api.get('/smart-bins/nearby', {
      params: { longitude, latitude, maxDistance }
    });
    return response.data;
  },

  async getBinsNeedingCollection(threshold: number = 80) {
    const response = await api.get('/smart-bins/needs-collection', {
      params: { threshold }
    });
    return response.data;
  },
};
