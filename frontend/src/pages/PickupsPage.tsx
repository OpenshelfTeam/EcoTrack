import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  Calendar, Plus, Search, Filter, MapPin, Clock, Trash2,
  CheckCircle, AlertCircle, XCircle, Package, X, ChevronRight
} from 'lucide-react';
import { pickupService } from '../services/pickup.service';

interface PickupRequest {
  id: string;
  address: string;
  wasteType: 'bulk' | 'hazardous' | 'electronic' | 'construction' | 'organic' | 'recyclable' | 'other';
  requestDate: string;
  preferredDate: string;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  collectorName?: string;
  notes?: string;
  weight?: number;
  scheduledDate?: string;
}

export const PickupsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch pickup requests with filters
  const { data: pickupsData, isLoading, error } = useQuery({
    queryKey: ['pickups', { search: searchTerm, status: filterStatus, wasteType: filterType }],
    queryFn: () => pickupService.getAllPickups({
      search: searchTerm,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      wasteType: filterType !== 'all' ? filterType : undefined,
    }),
  });

  // Create pickup mutation
  const createPickupMutation = useMutation({
    mutationFn: pickupService.createPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      setShowRequestModal(false);
      resetNewRequest();
    },
    onError: (error: any) => {
      alert(`Error creating pickup: ${error.response?.data?.message || error.message}`);
      console.error('Pickup creation error:', error.response?.data);
    },
  });

  // Update pickup mutation
  const updatePickupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pickupService.updatePickup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      setShowDetailsModal(false);
    },
  });

  // Cancel pickup mutation
  const cancelPickupMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => pickupService.cancelPickup(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
    },
    onError: (error: any) => {
      alert(`Error cancelling pickup: ${error.response?.data?.message || error.message}`);
    },
  });

  const pickupRequests: PickupRequest[] = pickupsData?.data?.map((pickup: any) => ({
    id: pickup._id,
    address: pickup.pickupLocation?.address || pickup.location?.address || 'Unknown Address',
    wasteType: pickup.wasteType,
    requestDate: pickup.createdAt ? new Date(pickup.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    preferredDate: new Date(pickup.preferredDate).toISOString().split('T')[0],
    preferredTime: pickup.timeSlot || 'morning',
    status: pickup.status,
    collectorName: pickup.assignedCollector?.firstName ? `${pickup.assignedCollector.firstName} ${pickup.assignedCollector.lastName}` : undefined,
    scheduledDate: pickup.scheduledDate ? new Date(pickup.scheduledDate).toISOString().split('T')[0] : undefined,
    notes: pickup.notes || pickup.description,
    weight: pickup.quantity?.value,
  })) || [];

  const [newRequest, setNewRequest] = useState<Partial<PickupRequest>>({
    address: '123 Main St, Apt 4B',
    wasteType: 'recyclable',
    preferredDate: '',
    preferredTime: 'morning',
    status: 'pending',
    requestDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Pickups are already filtered by the API query
  const filteredPickups = pickupRequests;

  // Statistics
  const stats = {
    total: pickupRequests.length,
    pending: pickupRequests.filter(p => p.status === 'pending').length,
    scheduled: pickupRequests.filter(p => p.status === 'scheduled').length,
    completed: pickupRequests.filter(p => p.status === 'completed').length,
    cancelled: pickupRequests.filter(p => p.status === 'cancelled').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getWasteTypeColor = (type: string) => {
    switch (type) {
      case 'bulk': return 'bg-purple-100 text-purple-700';
      case 'hazardous': return 'bg-red-100 text-red-700';
      case 'electronic': return 'bg-yellow-100 text-yellow-700';
      case 'construction': return 'bg-orange-100 text-orange-700';
      case 'organic': return 'bg-green-100 text-green-700';
      case 'recyclable': return 'bg-blue-100 text-blue-700';
      case 'other': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getWasteTypeIcon = () => {
    return <Trash2 className="w-4 h-4" />;
  };

  const handleRequestPickup = () => {
    createPickupMutation.mutate({
      wasteType: newRequest.wasteType,
      description: newRequest.notes || 'Pickup request',
      quantity: {
        value: 1,
        unit: 'items'
      },
      pickupLocation: {
        type: 'Point',
        coordinates: [79.8612, 6.9271], // Default Colombo coordinates
        address: newRequest.address || '123 Main St, Apt 4B'
      },
      preferredDate: newRequest.preferredDate,
      timeSlot: newRequest.preferredTime,
      contactPerson: {
        name: 'User', // Will be populated from logged-in user
        phone: '0771234567'
      },
      notes: newRequest.notes,
    });
  };

  const handleCancelPickup = (id: string) => {
    if (confirm('Are you sure you want to cancel this pickup request?')) {
      cancelPickupMutation.mutate({ id, reason: 'Cancelled by user' });
    }
  };

  const resetNewRequest = () => {
    setNewRequest({
      address: '123 Main St, Apt 4B',
      wasteType: 'recyclable',
      preferredDate: '',
      preferredTime: 'morning',
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <Calendar className="w-7 h-7" />
              </div>
              Pickup Requests
            </h1>
            <p className="text-gray-600 mt-1">Request and track your waste collection pickups</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Request Pickup
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading pickup requests</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!isLoading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Search and Filters */}
        {!isLoading && !error && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by address or waste type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
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

          {/* Expandable Filters */}
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
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="bulk">Bulk Items</option>
                  <option value="hazardous">Hazardous Waste</option>
                  <option value="electronic">Electronic Waste</option>
                  <option value="construction">Construction Waste</option>
                  <option value="organic">Organic Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Pickup Requests List */}
        {!isLoading && !error && (
        <div className="space-y-4">
          {filteredPickups.map((pickup) => (
            <div
              key={pickup.id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        {getWasteTypeIcon()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWasteTypeColor(pickup.wasteType)}`}>
                            {pickup.wasteType}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(pickup.status)}`}>
                            {getStatusIcon(pickup.status)}
                            {pickup.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{pickup.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested</p>
                        <p className="text-sm font-medium text-gray-900">{pickup.requestDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Preferred Date</p>
                        <p className="text-sm font-medium text-gray-900">{pickup.preferredDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time Slot</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{pickup.preferredTime}</p>
                      </div>
                      {pickup.collectorName && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Collector</p>
                          <p className="text-sm font-medium text-gray-900">{pickup.collectorName}</p>
                        </div>
                      )}
                    </div>

                    {pickup.notes && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{pickup.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedPickup(pickup);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 lg:flex-none px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {(pickup.status === 'pending' || pickup.status === 'scheduled') && (
                      <button
                        onClick={() => handleCancelPickup(pickup.id)}
                        className="flex-1 lg:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* No Results */}
        {filteredPickups.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pickup requests found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Request Your First Pickup
            </button>
          </div>
        )}
        </div>
        )}
      </div>

      {/* Request Pickup Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Request Pickup</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetNewRequest();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={newRequest.address}
                    onChange={(e) => setNewRequest({ ...newRequest, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type *</label>
                <select
                  value={newRequest.wasteType}
                  onChange={(e) => setNewRequest({ ...newRequest, wasteType: e.target.value as PickupRequest['wasteType'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="bulk">Bulk Items</option>
                  <option value="hazardous">Hazardous Waste</option>
                  <option value="electronic">Electronic Waste</option>
                  <option value="construction">Construction Waste</option>
                  <option value="organic">Organic Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
                  <input
                    type="date"
                    value={newRequest.preferredDate}
                    onChange={(e) => setNewRequest({ ...newRequest, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
                  <select
                    value={newRequest.preferredTime}
                    onChange={(e) => setNewRequest({ ...newRequest, preferredTime: e.target.value as PickupRequest['preferredTime'] })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="morning">Morning (8 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Any special instructions or details..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Pickup requests are processed within 24 hours</li>
                      <li>You will receive a confirmation once scheduled</li>
                      <li>Please ensure waste is properly sorted and sealed</li>
                      <li>Hazardous waste requires special handling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetNewRequest();
                }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPickup}
                disabled={!newRequest.address || !newRequest.preferredDate}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPickup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Pickup Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPickup(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <span className={`px-6 py-3 rounded-full text-sm font-semibold border-2 flex items-center gap-2 ${getStatusColor(selectedPickup.status)}`}>
                  {getStatusIcon(selectedPickup.status)}
                  {selectedPickup.status.toUpperCase()}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Request ID</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">#{selectedPickup.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                    <p className="text-lg font-medium text-gray-900 mt-1 flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                      {selectedPickup.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Waste Type</label>
                    <p className="mt-1">
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getWasteTypeColor(selectedPickup.wasteType)}`}>
                        {selectedPickup.wasteType}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Request Date</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{selectedPickup.requestDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Preferred Date</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{selectedPickup.preferredDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Time Slot</label>
                    <p className="text-lg font-medium text-gray-900 mt-1 capitalize">{selectedPickup.preferredTime}</p>
                  </div>
                </div>
              </div>

              {/* Collector Info */}
              {selectedPickup.collectorName && (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                  <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Collector Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-emerald-700">Assigned Collector</label>
                      <p className="font-medium text-emerald-900 mt-1">{selectedPickup.collectorName}</p>
                    </div>
                    {selectedPickup.scheduledDate && (
                      <div>
                        <label className="text-sm text-emerald-700">Scheduled Date</label>
                        <p className="font-medium text-emerald-900 mt-1">{selectedPickup.scheduledDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weight */}
              {selectedPickup.weight && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Collected Weight</label>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{selectedPickup.weight} kg</p>
                </div>
              )}

              {/* Notes */}
              {selectedPickup.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700">{selectedPickup.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPickup(null);
                }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              {(selectedPickup.status === 'pending' || selectedPickup.status === 'scheduled') && (
                <button
                  onClick={() => {
                    handleCancelPickup(selectedPickup.id);
                    setShowDetailsModal(false);
                    setSelectedPickup(null);
                  }}
                  className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Cancel Pickup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
