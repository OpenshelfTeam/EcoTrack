import api from './api';

export interface Route {
  _id: string;
  routeName: string;
  routeCode: string;
  assignedCollector: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  area: string;
  bins: any[];
  scheduledDate: Date;
  scheduledTime: {
    start: string;
    end: string;
  };
  status: string;
  priority: string;
  startTime?: Date;
  endTime?: Date;
  totalBins: number;
  collectedBins: number;
  distance: number;
  notes?: string;
  startLocation?: {
    coordinates: number[];
    address?: string;
  };
  endLocation?: {
    coordinates: number[];
    address?: string;
  };
}

export interface RouteStats {
  total: number;
  pending: number;
  'in-progress': number;
  completed: number;
  cancelled: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  todayRoutes: number;
  upcomingRoutes: number;
  avgDuration: number;
  avgDistance: number;
  totalDistance: number;
  totalBinsCollected: number;
  completedRoutes: number;
}

export const routeService = {
  async getAllRoutes(params?: any) {
    const response = await api.get('/routes', { params });
    return response.data;
  },

  async getRoute(id: string) {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  },

  async createRoute(data: any) {
    const response = await api.post('/routes', data);
    return response.data;
  },

  async updateRoute(id: string, data: any) {
    const response = await api.put(`/routes/${id}`, data);
    return response.data;
  },

  async deleteRoute(id: string) {
    const response = await api.delete(`/routes/${id}`);
    return response.data;
  },

  async updateRouteStatus(id: string, status: string, notes?: string) {
    const response = await api.patch(`/routes/${id}/status`, { status, notes });
    return response.data;
  },

  async startRoute(id: string) {
    const response = await api.patch(`/routes/${id}/start`);
    return response.data;
  },

  async completeRoute(id: string, data: { distance?: number; collectedBins?: number }) {
    const response = await api.patch(`/routes/${id}/complete`, data);
    return response.data;
  },

  async optimizeRoute(id: string) {
    const response = await api.post(`/routes/${id}/optimize`);
    return response.data;
  },

  async getRouteStats() {
    const response = await api.get('/routes/stats');
    return response.data;
  },
};
