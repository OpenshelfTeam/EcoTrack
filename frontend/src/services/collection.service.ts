import api from './api';

export interface CollectionRecord {
  _id: string;
  route: any;
  bin: any;
  collector: any;
  resident?: any;
  collectionDate: Date;
  wasteWeight: number;
  wasteType: string;
  binLevelBefore: number;
  binLevelAfter: number;
  status: string;
  location: any;
  notes?: string;
  verificationCode?: string;
}

export interface CollectionStats {
  total: number;
  collected: number;
  'partially-collected': number;
  missed: number;
  exception: number;
  byWasteType: Record<string, { count: number; weight: number }>;
  todayCollections: number;
  weekCollections: number;
  totalWeightCollected: number;
}

export const collectionService = {
  async getAllCollections(params?: any) {
    const response = await api.get('/collections', { params });
    return response.data;
  },

  async getCollection(id: string) {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  async createCollection(data: any) {
    const response = await api.post('/collections', data);
    return response.data;
  },

  async updateCollection(id: string, data: any) {
    const response = await api.put(`/collections/${id}`, data);
    return response.data;
  },

  async deleteCollection(id: string) {
    const response = await api.delete(`/collections/${id}`);
    return response.data;
  },

  async getCollectionStats() {
    const response = await api.get('/collections/stats');
    return response.data;
  },

  async getCollectionSchedule(startDate: string, endDate: string, collector?: string) {
    const response = await api.get('/collections/schedule', {
      params: { startDate, endDate, collector }
    });
    return response.data;
  },

  async getRoutes(params?: any) {
    const response = await api.get('/collections/routes', { params });
    return response.data;
  },

  async createRoute(data: any) {
    const response = await api.post('/collections/routes', data);
    return response.data;
  },
};
