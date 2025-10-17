import api from './api';

export interface Subscription {
  _id: string;
  user: string;
  plan: 'basic' | 'standard' | 'premium';
  monthlyCharge: number;
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  startDate: string;
  nextBillingDate: string;
  lastPaymentDate?: string;
  paymentMethod: {
    type: 'card' | 'bank-transfer' | 'cash' | 'online';
    details: string;
  };
  billingHistory: BillingRecord[];
  autoRenew: boolean;
  features: {
    maxBins: number;
    maxPickupsPerMonth: number;
    prioritySupport: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord {
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentId: string;
  notes: string;
}

export interface CreateSubscriptionData {
  plan?: 'basic' | 'standard' | 'premium';
  paymentMethod: {
    type: 'card' | 'bank-transfer' | 'cash' | 'online';
    details: string;
  };
}

export interface UpdateSubscriptionData {
  plan?: 'basic' | 'standard' | 'premium';
  paymentMethod?: {
    type: 'card' | 'bank-transfer' | 'cash' | 'online';
    details: string;
  };
  autoRenew?: boolean;
}

const subscriptionService = {
  // Get current user's subscription
  getMySubscription: async (): Promise<Subscription> => {
    const response = await api.get('/subscriptions/my-subscription');
    return response.data;
  },

  // Create new subscription
  createSubscription: async (data: CreateSubscriptionData): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },

  // Update subscription
  updateSubscription: async (id: string, data: UpdateSubscriptionData): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (id: string): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
  },

  // Process payment for subscription
  processPayment: async (id: string, paymentDetails?: { notes?: string }): Promise<{ message: string; subscription: Subscription; payment: any }> => {
    const response = await api.post(`/subscriptions/${id}/process-payment`, { paymentDetails });
    return response.data;
  },

  // Reactivate subscription
  reactivateSubscription: async (id: string): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post(`/subscriptions/${id}/reactivate`);
    return response.data;
  },

  // Get all subscriptions (Admin only)
  getAllSubscriptions: async (filters?: { status?: string; plan?: string }): Promise<{ count: number; subscriptions: Subscription[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plan) params.append('plan', filters.plan);
    
    const response = await api.get(`/subscriptions?${params.toString()}`);
    return response.data;
  },

  // Get subscriptions due for billing (Admin only)
  getDueSubscriptions: async (): Promise<{ count: number; subscriptions: Subscription[] }> => {
    const response = await api.get('/subscriptions/due-billing');
    return response.data;
  }
};

export default subscriptionService;
