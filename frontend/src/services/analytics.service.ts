import api from './api';

export interface DashboardStats {
  bins: {
    total: number;
    active: number;
    needingCollection: number;
  };
  collections: {
    total: number;
    today: number;
  };
  pickups: {
    total: number;
    pending: number;
  };
  tickets: {
    total: number;
    open: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  routes: {
    active: number;
  };
  users: {
    total: number;
  };
}

export const analyticsService = {
  async getDashboardStats() {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  async getWasteStatistics(params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month' }) {
    const response = await api.get('/analytics/waste', { params });
    return response.data;
  },

  async getEfficiencyMetrics() {
    const response = await api.get('/analytics/efficiency');
    return response.data;
  },

  async getFinancialAnalytics(params?: { year?: number }) {
    const response = await api.get('/analytics/financial', { params });
    return response.data;
  },

  async getAreaStatistics() {
    const response = await api.get('/analytics/areas');
    return response.data;
  },

  async getEngagementStatistics() {
    const response = await api.get('/analytics/engagement');
    return response.data;
  },

  async exportAnalytics(type: 'collections' | 'pickups' | 'payments', startDate?: string, endDate?: string) {
    const response = await api.get('/analytics/export', {
      params: { type, startDate, endDate }
    });
    return response.data;
  },
};
