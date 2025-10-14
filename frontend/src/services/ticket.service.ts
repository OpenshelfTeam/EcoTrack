import api from './api';

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reporter: any;
  assignedTo?: any;
  createdAt: Date;
  updatedAt: Date;
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
};
