import api from './api';

export interface Ticket {
  _id: string;
  ticketId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'collection' | 'bin' | 'payment' | 'technical' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reporter: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  comments: Comment[];
  attachments: string[];
  resolution?: {
    resolvedBy?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    resolvedAt?: Date;
    resolution?: string;
    actionTaken?: string;
  };
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  message: string;
  createdAt: Date;
}

export const ticketService = {
  async getAllTickets(params?: any) {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  async getTicket(id: string) {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  async createTicket(data: any) {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  async updateTicket(id: string, data: any) {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },

  async deleteTicket(id: string) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },

  async assignTicket(id: string, userId: string) {
    const response = await api.patch(`/tickets/${id}/assign`, { userId });
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  async updatePriority(id: string, priority: string) {
    const response = await api.patch(`/tickets/${id}/priority`, { priority });
    return response.data;
  },

  async addComment(id: string, comment: string) {
    const response = await api.post(`/tickets/${id}/comments`, { message: comment });
    return response.data;
  },

  async resolveTicket(id: string, resolution: string) {
    const response = await api.patch(`/tickets/${id}/resolve`, { resolution });
    return response.data;
  },

  async getTicketStats() {
    const response = await api.get('/tickets/stats');
    return response.data;
  },
};
