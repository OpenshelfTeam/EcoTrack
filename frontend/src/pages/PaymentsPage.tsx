import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  CreditCard, DollarSign, Calendar, Download, Search, Filter,
  CheckCircle, Clock, XCircle, Receipt, TrendingUp,
  X, Eye, Printer, AlertCircle, Plus, Edit2, Trash2
} from 'lucide-react';
import { paymentService, type Payment } from '../services/payment.service';

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank-transfer' | 'online';
  name: string;
  details: string;
  isDefault: boolean;
}

export const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showSavedMethodsModal, setShowSavedMethodsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string>('');
  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | null>(null);
  
  // Saved payment methods (in real app, fetch from backend)
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      details: '**** **** **** 4242',
      isDefault: true
    },
    {
      id: '2',
      type: 'bank-transfer',
      name: 'Bank Account',
      details: 'Account ending in 1234',
      isDefault: false
    }
  ]);

  const [newMethod, setNewMethod] = useState({
    type: 'card' as 'card' | 'bank-transfer' | 'online',
    name: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    isDefault: false
  });

  // Fetch payments with React Query
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', { 
      status: filterStatus !== 'all' ? filterStatus : undefined,
      search: searchTerm || undefined
    }],
    queryFn: () => paymentService.getAllPayments({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      search: searchTerm
    })
  });

  // Fetch payment stats
  const { data: statsData } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentService.getPaymentStats()
  });

  const payments = paymentsData?.data || [];

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      setShowPaymentModal(false);
    },
    onError: (error: any) => {
      alert('Failed to create payment: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentMethod }: { id: string; status: string; paymentMethod?: string }) =>
      paymentService.updatePaymentStatus(id, status, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      setShowPaymentModal(false);
    },
    onError: (error: any) => {
      alert('Failed to update payment status: ' + (error.response?.data?.message || error.message));
    }
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: paymentService.generateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      alert('Invoice generated successfully!');
    },
    onError: (error: any) => {
      alert('Failed to generate invoice: ' + (error.response?.data?.message || error.message));
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: paymentService.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
    },
    onError: (error: any) => {
      alert('Failed to delete payment: ' + (error.response?.data?.message || error.message));
    }
  });

  // Loading and error states
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">Failed to load payments</p>
            <p className="text-gray-600 mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate statistics from API data or use default values
  const stats = statsData?.data || {
    totalPaid: payments.filter((p: Payment) => p.status === 'paid').reduce((sum: number, p: Payment) => sum + p.amount, 0),
    pending: payments.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + p.amount, 0),
    failed: payments.filter((p: Payment) => p.status === 'failed').reduce((sum: number, p: Payment) => sum + p.amount, 0),
    total: payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'refunded': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'refunded': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handlePayNow = (payment: Payment) => {
    setSelectedPayment(payment);
    setSelectedPaymentMethod('');
    setSelectedSavedMethod('');
    setShowPaymentModal(true);
  };

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleAddPaymentMethod = () => {
    setEditingMethod(null);
    setNewMethod({
      type: 'card',
      name: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      isDefault: savedMethods.length === 0
    });
    setShowAddMethodModal(true);
  };

  const handleEditMethod = (method: SavedPaymentMethod) => {
    setEditingMethod(method);
    setNewMethod({
      type: method.type,
      name: method.name,
      cardNumber: method.details,
      expiryDate: '',
      cvv: '',
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      isDefault: method.isDefault
    });
    setShowAddMethodModal(true);
  };

  const handleDeleteMethod = (methodId: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      setSavedMethods(savedMethods.filter(m => m.id !== methodId));
      alert('Payment method deleted successfully!');
    }
  };

  const handleSavePaymentMethod = () => {
    if (editingMethod) {
      // Update existing method
      setSavedMethods(savedMethods.map(m => 
        m.id === editingMethod.id 
          ? {
              ...m,
              name: newMethod.name,
              type: newMethod.type,
              details: newMethod.type === 'card' 
                ? `**** **** **** ${newMethod.cardNumber.slice(-4)}`
                : `Account ending in ${newMethod.accountNumber.slice(-4)}`,
              isDefault: newMethod.isDefault
            }
          : { ...m, isDefault: newMethod.isDefault ? false : m.isDefault }
      ));
      alert('Payment method updated successfully!');
    } else {
      // Add new method
      const newId = (savedMethods.length + 1).toString();
      const method: SavedPaymentMethod = {
        id: newId,
        type: newMethod.type,
        name: newMethod.name,
        details: newMethod.type === 'card' 
          ? `**** **** **** ${newMethod.cardNumber.slice(-4)}`
          : `Account ending in ${newMethod.accountNumber.slice(-4)}`,
        isDefault: newMethod.isDefault
      };
      
      setSavedMethods([
        ...savedMethods.map(m => ({ ...m, isDefault: newMethod.isDefault ? false : m.isDefault })),
        method
      ]);
      alert('Payment method added successfully!');
    }
    
    setShowAddMethodModal(false);
    setEditingMethod(null);
  };

  const handleUseSavedMethod = (methodId: string) => {
    setSelectedSavedMethod(methodId);
    const method = savedMethods.find(m => m.id === methodId);
    if (method) {
      setSelectedPaymentMethod(method.type === 'card' ? 'card' : method.type);
    }
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    try {
      const blob = await paymentService.downloadInvoice(payment._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${payment.invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert('Failed to download invoice: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProcessPayment = () => {
    if (selectedPayment && selectedPaymentMethod) {
      updateStatusMutation.mutate({
        id: selectedPayment._id,
        status: 'paid',
        paymentMethod: selectedPaymentMethod
      });
      setSelectedPayment(null);
      setSelectedPaymentMethod('');
    }
  };

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
              Payments & Billing
            </h1>
            <p className="text-gray-600 mt-1">Manage your payment history and billing information</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSavedMethodsModal(true)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              My Payment Methods ({savedMethods.length})
            </button>
            <button
              onClick={handleAddPaymentMethod}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Paid</p>
                <p className="text-3xl font-bold mt-1">${stats.totalPaid.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">${stats.pending.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">${stats.failed?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${stats.total?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search payments or invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {payments.map((payment: Payment) => (
            <div
              key={payment._id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${payment.status === 'failed' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">{payment.invoiceId}</span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{payment.description}</h3>
                        <p className="text-sm text-gray-600">
                          User: {payment.user.firstName} {payment.user.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      </div>
                      {payment.paymentDate && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid: {new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{payment.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${payment.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewInvoice(payment)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(payment)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handlePayNow(payment)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Complete Payment</h2>
              <button onClick={() => { setShowPaymentModal(false); setSelectedPayment(null); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Amount Due</p>
                <p className="text-3xl font-bold text-gray-900">${selectedPayment.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-2">{selectedPayment.description}</p>
                <p className="text-xs text-gray-500 mt-1">Invoice: {selectedPayment.invoiceId}</p>
                <p className="text-xs text-gray-500">Due: {new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
              </div>

              {/* Saved Payment Methods */}
              {savedMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Saved Payment Methods</label>
                  <div className="space-y-2">
                    {savedMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSavedMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="savedMethod"
                          value={method.id}
                          checked={selectedSavedMethod === method.id}
                          onChange={() => handleUseSavedMethod(method.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{method.name}</span>
                            {method.isDefault && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{method.details}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Or use a different method</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {savedMethods.length > 0 ? 'Other Payment Methods' : 'Select Payment Method'}
                </label>
                <div className="space-y-2">
                  {['cash', 'card', 'bank-transfer', 'online'].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPaymentMethod === method && !selectedSavedMethod
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={selectedPaymentMethod === method && !selectedSavedMethod}
                        onChange={(e) => {
                          setSelectedPaymentMethod(e.target.value);
                          setSelectedSavedMethod('');
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 capitalize">
                            {method.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Secure Payment</p>
                <p className="text-xs">Your payment information is encrypted and secure.</p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => { setShowPaymentModal(false); setSelectedPayment(null); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={!selectedPaymentMethod && !selectedSavedMethod}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Pay ${selectedPayment.amount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
              <button onClick={() => { setShowInvoiceModal(false); setSelectedPayment(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">EcoTrack</h3>
                  <p className="text-sm text-gray-600">Waste Management Solutions</p>
                  <p className="text-sm text-gray-600">123 Green Street</p>
                  <p className="text-sm text-gray-600">Eco City, EC 12345</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">INVOICE</p>
                  <p className="text-xl font-bold text-gray-900">{selectedPayment.invoiceId}</p>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Due Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(selectedPayment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedPayment.paymentDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Paid Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Bill To */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedPayment.user.firstName} {selectedPayment.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedPayment.user.email}</p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPayment.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">{item.description}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-4 text-right font-bold text-gray-900">Total Amount</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                          ${selectedPayment.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPayment.paymentMethod && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm font-medium text-emerald-900 mb-1">Payment Method</p>
                  <p className="text-sm text-emerald-700">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>Thank you for your business!</p>
                <p className="mt-1">For questions, contact us at support@ecotrack.com</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => handleDownloadInvoice(selectedPayment)}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => alert('Print invoice')}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => { setShowInvoiceModal(false); setSelectedPayment(null); }}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
              <h2 className="text-xl font-bold text-white">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button 
                onClick={() => { setShowAddMethodModal(false); setEditingMethod(null); }} 
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Method Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'card', label: 'Card' },
                    { value: 'bank-transfer', label: 'Bank' },
                    { value: 'online', label: 'Online' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewMethod({ ...newMethod, type: type.value as any })}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        newMethod.type === type.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  placeholder="e.g., My Visa Card, Chase Bank"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Card Details */}
              {newMethod.type === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={newMethod.cardNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, cardNumber: e.target.value.replace(/\s/g, '').slice(0, 16) })}
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={newMethod.expiryDate}
                        onChange={(e) => setNewMethod({ ...newMethod, expiryDate: e.target.value })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        value={newMethod.cvv}
                        onChange={(e) => setNewMethod({ ...newMethod, cvv: e.target.value.slice(0, 4) })}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Details */}
              {newMethod.type === 'bank-transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={newMethod.bankName}
                      onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                      placeholder="e.g., Chase Bank"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                      placeholder="Account number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                    <input
                      type="text"
                      value={newMethod.routingNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value })}
                      placeholder="Routing number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Set as Default */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="setDefault"
                  checked={newMethod.isDefault}
                  onChange={(e) => setNewMethod({ ...newMethod, isDefault: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="setDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Set as default payment method
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">🔒 Secure Storage</p>
                <p className="text-xs">Your payment information is encrypted and stored securely.</p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => { setShowAddMethodModal(false); setEditingMethod(null); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaymentMethod}
                disabled={!newMethod.name || (newMethod.type === 'card' && (!newMethod.cardNumber || newMethod.cardNumber.length < 13)) || (newMethod.type === 'bank-transfer' && !newMethod.accountNumber)}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMethod ? 'Update Method' : 'Save Method'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Payment Methods Modal */}
      {showSavedMethodsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
              <h2 className="text-xl font-bold text-white">My Payment Methods</h2>
              <button 
                onClick={() => setShowSavedMethodsModal(false)} 
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {savedMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods saved</h3>
                  <p className="text-gray-600 mb-4">Add a payment method for faster checkout</p>
                  <button
                    onClick={() => {
                      setShowSavedMethodsModal(false);
                      handleAddPaymentMethod();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {savedMethods.map((method) => (
                      <div
                        key={method.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-emerald-50 rounded-lg">
                              <CreditCard className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{method.name}</h3>
                                {method.isDefault && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{method.details}</p>
                              <p className="text-xs text-gray-500 mt-1 capitalize">{method.type.replace('-', ' ')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowSavedMethodsModal(false);
                                handleEditMethod(method);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMethod(method.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setShowSavedMethodsModal(false);
                      handleAddPaymentMethod();
                    }}
                    className="w-full px-6 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Payment Method
                  </button>
                </>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowSavedMethodsModal(false)}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
