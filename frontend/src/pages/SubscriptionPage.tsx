import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  CreditCard, Calendar, CheckCircle, XCircle, Clock,
  X, Crown, Star, Zap, Check, AlertCircle, Receipt, AlertTriangle
} from 'lucide-react';
import subscriptionService, { type CreateSubscriptionData, type UpdateSubscriptionData } from '../services/subscription.service';

export const SubscriptionPage = () => {
  const queryClient = useQueryClient();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'card' as 'card' | 'bank-transfer' | 'cash' | 'online',
    details: ''
  });

  // Fetch user's subscription
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
    retry: false
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: CreateSubscriptionData) => subscriptionService.createSubscription(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      setShowPlanModal(false);
      setShowPaymentModal(false);
      alert(data.message);
    },
    onError: (error: any) => {
      alert('Failed to create subscription: ' + (error.response?.data?.message || error.message));
    }
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionData }) => 
      subscriptionService.updateSubscription(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      setShowPlanModal(false);
      alert(data.message);
    },
    onError: (error: any) => {
      alert('Failed to update subscription: ' + (error.response?.data?.message || error.message));
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.cancelSubscription(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      alert(data.message);
    },
    onError: (error: any) => {
      alert('Failed to cancel subscription: ' + (error.response?.data?.message || error.message));
    }
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.reactivateSubscription(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      alert(data.message);
    },
    onError: (error: any) => {
      alert('Failed to reactivate subscription: ' + (error.response?.data?.message || error.message));
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.processPayment(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      alert(data.message);
    },
    onError: (error: any) => {
      alert('Failed to process payment: ' + (error.response?.data?.message || error.message));
    }
  });

  const plans = [
    {
      name: 'basic' as const,
      displayName: 'Basic',
      price: 25,
      icon: Star,
      color: 'emerald',
      features: [
        'Up to 2 waste bins',
        '4 pickups per month',
        'Standard support',
        'Basic analytics',
        'Mobile app access'
      ]
    },
    {
      name: 'standard' as const,
      displayName: 'Standard',
      price: 40,
      icon: Zap,
      color: 'blue',
      popular: true,
      features: [
        'Up to 3 waste bins',
        '8 pickups per month',
        'Priority support',
        'Advanced analytics',
        'Mobile app access',
        'Email notifications'
      ]
    },
    {
      name: 'premium' as const,
      displayName: 'Premium',
      price: 60,
      icon: Crown,
      color: 'purple',
      features: [
        'Up to 5 waste bins',
        '12 pickups per month',
        '24/7 Priority support',
        'Full analytics suite',
        'Mobile app access',
        'SMS & Email notifications',
        'Dedicated account manager'
      ]
    }
  ];

  const handleCreateSubscription = () => {
    if (!paymentMethod.details) {
      alert('Please enter payment details');
      return;
    }

    createSubscriptionMutation.mutate({
      plan: selectedPlan,
      paymentMethod
    });
  };

  const handleChangePlan = (newPlan: 'basic' | 'standard' | 'premium') => {
    if (!subscription) return;

    if (confirm(`Are you sure you want to change to the ${newPlan} plan?`)) {
      updateSubscriptionMutation.mutate({
        id: subscription._id,
        data: { plan: newPlan }
      });
    }
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;

    if (confirm('Are you sure you want to cancel your subscription? You can continue using the service until the end of your billing period.')) {
      cancelSubscriptionMutation.mutate(subscription._id);
    }
  };

  const handleReactivateSubscription = () => {
    if (!subscription) return;

    if (confirm('Reactivate your subscription?')) {
      reactivateSubscriptionMutation.mutate(subscription._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      case 'suspended': return AlertTriangle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <CreditCard className="w-7 h-7" />
              </div>
              Subscription Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your monthly waste collection subscription</p>
          </div>
        </div>

        {/* Current Subscription Status */}
        {subscription ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Current Subscription</h2>
              {(() => {
                const StatusIcon = getStatusIcon(subscription.status);
                return (
                  <span className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${getStatusColor(subscription.status)}`}>
                    <StatusIcon className="w-4 h-4" />
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{subscription.plan}</p>
                <p className="text-lg text-emerald-600 font-semibold">${subscription.monthlyCharge}/month</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Next Billing Date</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {subscription.paymentMethod.type === 'card' ? 'Credit Card' : subscription.paymentMethod.type.replace('-', ' ')}
                </p>
                <p className="text-sm text-gray-500">{subscription.paymentMethod.details}</p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Plan Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Up to {subscription.features.maxBins} bins</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>{subscription.features.maxPickupsPerMonth} pickups/month</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>{subscription.features.prioritySupport ? 'Priority' : 'Standard'} support</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
              {subscription.status === 'active' && (
                <>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                  <button
                    onClick={() => processPaymentMutation.mutate(subscription._id)}
                    disabled={processPaymentMutation.isPending}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {processPaymentMutation.isPending ? 'Processing...' : 'Pay Now'}
                  </button>
                </>
              )}
              {(subscription.status === 'cancelled' || subscription.status === 'suspended') && (
                <button
                  onClick={handleReactivateSubscription}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Reactivate Subscription
                </button>
              )}
            </div>

            {/* Billing History */}
            {subscription.billingHistory && subscription.billingHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Recent Billing History
                </h3>
                <div className="space-y-2">
                  {subscription.billingHistory.slice(-5).reverse().map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          ${record.amount.toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          record.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{record.paymentId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : error ? (
          // No subscription - Show plans
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900">No Active Subscription</h3>
                <p className="text-amber-700 mt-1">
                  You need an active subscription to use the waste collection service. Choose a plan below to get started.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Plans Section */}
        {!subscription || subscription.status === 'cancelled' ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-xl shadow-lg border-2 p-6 hover:shadow-xl transition-all relative ${
                      plan.popular ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`inline-flex p-3 rounded-full bg-${plan.color}-100 mb-4`}>
                        <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        setSelectedPlan(plan.name);
                        setShowPaymentModal(true);
                      }}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Get Started
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Change Plan Modal */}
        {showPlanModal && subscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">Change Your Plan</h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = subscription.plan === plan.name;
                    
                    return (
                      <div
                        key={plan.name}
                        className={`bg-white rounded-xl shadow-md border-2 p-6 ${
                          isCurrentPlan ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                        }`}
                      >
                        {isCurrentPlan && (
                          <div className="mb-4">
                            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              CURRENT PLAN
                            </span>
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <div className={`inline-flex p-3 rounded-full bg-${plan.color}-100 mb-4`}>
                            <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                            <span className="text-gray-600">/month</span>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleChangePlan(plan.name)}
                          disabled={isCurrentPlan || updateSubscriptionMutation.isPending}
                          className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                            isCurrentPlan
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isCurrentPlan ? 'Current Plan' : 'Switch to This Plan'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal for New Subscription */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Setup Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {plans.find(p => p.name === selectedPlan)?.displayName} Plan
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    ${plans.find(p => p.name === selectedPlan)?.price}/month
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod.type}
                    onChange={(e) => setPaymentMethod({ ...paymentMethod, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Details
                  </label>
                  <input
                    type="text"
                    value={paymentMethod.details}
                    onChange={(e) => setPaymentMethod({ ...paymentMethod, details: e.target.value })}
                    placeholder={
                      paymentMethod.type === 'card' ? 'Card ending in 4242' :
                      paymentMethod.type === 'bank-transfer' ? 'Account number' :
                      'Email or phone'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your card will be charged ${plans.find(p => p.name === selectedPlan)?.price} monthly.
                    You can cancel anytime.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSubscription}
                    disabled={createSubscriptionMutation.isPending}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {createSubscriptionMutation.isPending ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
