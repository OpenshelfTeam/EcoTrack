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

  // Record bin collection during route execution
  async recordBinCollection(data: {
    route: string;
    bin: string;
    status: 'collected' | 'empty' | 'exception';
    wasteWeight?: number;
    binLevelBefore?: number;
    binLevelAfter?: number;
    notes?: string;
    exception?: {
      issueType: string;
      description: string;
      photo?: File;
    };
  }) {
    // If there's a photo exception, use FormData, otherwise use JSON
    if (data.exception?.photo) {
      const formData = new FormData();
      
      formData.append('route', data.route);
      formData.append('bin', data.bin);
      formData.append('status', data.status);
      
      if (data.wasteWeight !== undefined) formData.append('wasteWeight', data.wasteWeight.toString());
      if (data.binLevelBefore !== undefined) formData.append('binLevelBefore', data.binLevelBefore.toString());
      if (data.binLevelAfter !== undefined) formData.append('binLevelAfter', data.binLevelAfter.toString());
      if (data.notes) formData.append('notes', data.notes);
      
      formData.append('exceptionReported', 'true');
      formData.append('exceptionReason', data.exception.issueType);
      formData.append('exceptionDescription', data.exception.description);
      formData.append('exceptionPhoto', data.exception.photo);

      const response = await api.post('/collections', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Use JSON for simple collections without photos
      const payload: any = {
        route: data.route,
        bin: data.bin,
        status: data.status,
        wasteWeight: data.wasteWeight,
        binLevelBefore: data.binLevelBefore,
        binLevelAfter: data.binLevelAfter,
        notes: data.notes,
      };

      if (data.exception) {
        payload.exceptionReported = true;
        payload.exceptionReason = data.exception.issueType;
        payload.exceptionDescription = data.exception.description;
      }

      const response = await api.post('/collections', payload);
      return response.data;
    }
  },
};
