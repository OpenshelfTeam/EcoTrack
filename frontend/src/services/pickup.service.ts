import api from './api';

export interface PickupRequest {
  _id: string;
  requestId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  wasteType: string;
  quantity: string;
  preferredDate: Date;
  preferredTimeSlot: string;
  location: {
    type: string;
    coordinates: number[];
    address: string;
  };
  status: string;
  assignedCollector?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  scheduledDate?: Date;
  completedDate?: Date;
  notes?: string;
  collectorNotes?: string;
  rating?: number;
  feedback?: string;
  statusHistory?: Array<{
    status: string;
    updatedBy: string;
    updatedAt: Date;
    notes?: string;
  }>;
}

export interface PickupStats {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  todayPickups: number;
  upcomingPickups: number;
}

export const pickupService = {
  async getAllPickups(params?: any) {
    const response = await api.get('/pickups', { params });
    return response.data;
  },

  async getPickup(id: string) {
    const response = await api.get(`/pickups/${id}`);
    return response.data;
  },

  async createPickup(data: any) {
    const response = await api.post('/pickups', data);
    return response.data;
  },

  async updatePickup(id: string, data: any) {
    const response = await api.put(`/pickups/${id}`, data);
    return response.data;
  },

  async deletePickup(id: string) {
    const response = await api.delete(`/pickups/${id}`);
    return response.data;
  },

  async updatePickupStatus(id: string, status: string, notes?: string) {
    const response = await api.patch(`/pickups/${id}/status`, { status, notes });
    return response.data;
  },

  async assignCollector(id: string, collectorId: string, scheduledDate?: string) {
    const response = await api.patch(`/pickups/${id}/assign`, { collectorId, scheduledDate });
    return response.data;
  },

  async cancelPickup(id: string, reason: string) {
    const response = await api.delete(`/pickups/${id}`, { data: { reason } });
    return response.data;
  },

  async getPickupStats() {
    const response = await api.get('/pickups/stats');
    return response.data;
  },

  async completePickup(id: string, data: { 
    binStatus: 'collected' | 'empty' | 'damaged';
    collectorNotes?: string;
    images?: string[];
  }) {
    const response = await api.patch(`/pickups/${id}/complete`, data);
    return response.data;
  },
};
