import api from './api';

export const collectionService = {
  async getAllCollections(params?: any) {
    const response = await api.get('/collections', { params });
    return response.data;
  },

  async createCollection(data: any) {
    const response = await api.post('/collections', data);
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
