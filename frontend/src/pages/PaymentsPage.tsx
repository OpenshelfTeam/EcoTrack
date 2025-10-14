import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  CreditCard, DollarSign, Calendar, Download, Search, Filter,
  CheckCircle, Clock, XCircle, Receipt, TrendingUp, FileText,
  Plus, ChevronRight, X, Eye, Printer
} from 'lucide-react';

interface Payment {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'mobile_payment';
  category: 'monthly_service' | 'extra_pickup' | 'bin_rental' | 'penalty' | 'bulk_waste';
  billingPeriod?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account';
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
  cardBrand?: string;
}

export const PaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Mock payment history data
  const [payments] = useState<Payment[]>([
    {
      id: 'PAY001',
      invoiceNumber: 'INV-2024-001',
      description: 'Monthly Waste Collection Service',
      amount: 49.99,
      status: 'paid',
      dueDate: '2024-10-01',
      paidDate: '2024-09-28',
      paymentMethod: 'credit_card',
      category: 'monthly_service',
      billingPeriod: 'October 2024'
    },
    {
      id: 'PAY002',
      invoiceNumber: 'INV-2024-002',
      description: 'Extra Pickup Request',
      amount: 15.00,
      status: 'paid',
      dueDate: '2024-10-05',
      paidDate: '2024-10-05',
      paymentMethod: 'mobile_payment',
      category: 'extra_pickup'
    },
    {
      id: 'PAY003',
      invoiceNumber: 'INV-2024-003',
      description: 'Monthly Waste Collection Service',
      amount: 49.99,
      status: 'pending',
      dueDate: '2024-11-01',
      category: 'monthly_service',
      billingPeriod: 'November 2024'
    },
    {
      id: 'PAY004',
      invoiceNumber: 'INV-2024-004',
      description: 'Bulk Waste Disposal',
      amount: 35.00,
      status: 'overdue',
      dueDate: '2024-10-10',
      category: 'bulk_waste'
    },
    {
      id: 'PAY005',
      invoiceNumber: 'INV-2024-005',
      description: 'Additional Recycling Bin Rental',
      amount: 12.00,
      status: 'paid',
      dueDate: '2024-09-15',
      paidDate: '2024-09-14',
      paymentMethod: 'bank_transfer',
      category: 'bin_rental',
      billingPeriod: 'September 2024'
    },
    {
      id: 'PAY006',
      invoiceNumber: 'INV-2024-006',
      description: 'Late Payment Penalty',
      amount: 5.00,
      status: 'cancelled',
      dueDate: '2024-09-20',
      category: 'penalty'
    }
  ]);

  // Mock payment methods
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'PM001',
      type: 'credit_card',
      last4: '4242',
      expiryDate: '12/26',
      isDefault: true,
      cardBrand: 'Visa'
    },
    {
      id: 'PM002',
      type: 'debit_card',
      last4: '5555',
      expiryDate: '08/25',
      isDefault: false,
      cardBrand: 'Mastercard'
    },
    {
      id: 'PM003',
      type: 'bank_account',
      last4: '8901',
      isDefault: false
    }
  ]);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || payment.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate statistics
  const stats = {
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => {
      const paymentDate = new Date(p.paidDate || p.dueDate);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'monthly_service': return 'bg-blue-100 text-blue-700';
      case 'extra_pickup': return 'bg-purple-100 text-purple-700';
      case 'bin_rental': return 'bg-teal-100 text-teal-700';
      case 'penalty': return 'bg-red-100 text-red-700';
      case 'bulk_waste': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePayNow = (payment: Payment) => {
    setSelectedPayment(payment);
    setSelectedPaymentMethod(paymentMethods.find(pm => pm.isDefault)?.id || '');
    setShowPaymentModal(true);
  };

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = (payment: Payment) => {
    alert(`Downloading invoice ${payment.invoiceNumber}`);
  };

  const handleProcessPayment = () => {
    if (selectedPayment && selectedPaymentMethod) {
      alert(`Payment of $${selectedPayment.amount} processed successfully!`);
      setShowPaymentModal(false);
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
                <p className="text-gray-600 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-1">${stats.overdue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${stats.thisMonth.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </h2>
            <button className="px-4 py-2 text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Method
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  method.isDefault
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${method.isDefault ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <CreditCard className={`w-5 h-5 ${method.isDefault ? 'text-emerald-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {method.cardBrand || method.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">•••• {method.last4}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </div>
                {method.expiryDate && (
                  <p className="text-xs text-gray-600">Expires: {method.expiryDate}</p>
                )}
              </div>
            ))}
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
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="monthly_service">Monthly Service</option>
                  <option value="extra_pickup">Extra Pickup</option>
                  <option value="bin_rental">Bin Rental</option>
                  <option value="penalty">Penalty</option>
                  <option value="bulk_waste">Bulk Waste</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${payment.status === 'overdue' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">{payment.invoiceNumber}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(payment.category)}`}>
                            {payment.category.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{payment.description}</h3>
                        {payment.billingPeriod && (
                          <p className="text-sm text-gray-600">Billing Period: {payment.billingPeriod}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {payment.dueDate}</span>
                      </div>
                      {payment.paidDate && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid: {payment.paidDate}</span>
                        </div>
                      )}
                      {payment.paymentMethod && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          <span>{payment.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      )}
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
                      {(payment.status === 'pending' || payment.status === 'overdue') && (
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

        {filteredPayments.length === 0 && (
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
                <p className="text-xs text-gray-500 mt-1">Invoice: {selectedPayment.invoiceNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {method.cardBrand || method.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">•••• {method.last4}</span>
                          {method.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                        {method.expiryDate && (
                          <p className="text-xs text-gray-500 mt-1">Expires: {method.expiryDate}</p>
                        )}
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
                disabled={!selectedPaymentMethod}
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
                  <p className="text-xl font-bold text-gray-900">{selectedPayment.invoiceNumber}</p>
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
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPayment.dueDate}</p>
                </div>
                {selectedPayment.paidDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Paid Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedPayment.paidDate}</p>
                  </div>
                )}
              </div>

              {/* Bill To */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">123 Main St, Apt 4B</p>
                  <p className="text-sm text-gray-600">Eco City, EC 12345</p>
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
                      <tr>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900">{selectedPayment.description}</p>
                          {selectedPayment.billingPeriod && (
                            <p className="text-sm text-gray-600">{selectedPayment.billingPeriod}</p>
                          )}
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getCategoryColor(selectedPayment.category)}`}>
                            {selectedPayment.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          ${selectedPayment.amount.toFixed(2)}
                        </td>
                      </tr>
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
    </Layout>
  );
};
