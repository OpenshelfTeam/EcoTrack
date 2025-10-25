import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Truck, Package, Calendar, CheckCircle, Clock, XCircle, MapPin, Phone, Mail, Navigation } from 'lucide-react';
import { deliveryService, type Delivery } from '../services/delivery.service';
import { useAuth } from '../contexts/AuthContext';

export const CollectorDeliveriesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: deliveriesData, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => deliveryService.getDeliveries()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ deliveryId, data }: { deliveryId: string; data: { status: string; note?: string } }) =>
      deliveryService.updateStatus(deliveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setShowStatusModal(false);
      setSelectedDelivery(null);
    }
  });

  const handleUpdateStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    const formData = new FormData(e.currentTarget);
    updateStatusMutation.mutate({
      deliveryId: selectedDelivery._id,
      data: {
        status: formData.get('status') as string,
        note: formData.get('note') as string
      }
    });
  };

  const deliveries = deliveriesData?.data || [];
  
  // Filter deliveries based on status
  const filteredDeliveries = filterStatus === 'all' 
    ? deliveries 
    : deliveries.filter((d: Delivery) => d.status === filterStatus);

  // Count deliveries by status
  const statusCounts = {
    scheduled: deliveries.filter((d: Delivery) => d.status === 'scheduled').length,
    'in-transit': deliveries.filter((d: Delivery) => d.status === 'in-transit').length,
    delivered: deliveries.filter((d: Delivery) => d.status === 'delivered').length,
    failed: deliveries.filter((d: Delivery) => d.status === 'failed').length,
    all: deliveries.length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-transit':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const openInMaps = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600" />
            My Deliveries
          </h1>
          <p className="text-gray-600 mt-1">Manage your assigned bin deliveries</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All', color: 'gray' },
            { value: 'scheduled', label: 'Scheduled', color: 'yellow' },
            { value: 'in-transit', label: 'In Transit', color: 'blue' },
            { value: 'delivered', label: 'Delivered', color: 'green' },
            { value: 'failed', label: 'Failed', color: 'red' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filterStatus === filter.value
                  ? `bg-${filter.color}-600 text-white shadow-lg`
                  : `bg-white text-gray-700 hover:bg-${filter.color}-50 border border-gray-200`
              }`}
            >
              {filter.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filterStatus === filter.value
                  ? 'bg-white/20'
                  : `bg-${filter.color}-100 text-${filter.color}-800`
              }`}>
                {statusCounts[filter.value as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>

        {/* Deliveries List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filterStatus === 'all' 
                ? 'No deliveries assigned yet' 
                : `No ${filterStatus} deliveries`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeliveries.map((delivery: Delivery) => (
              <div key={delivery._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                {/* Delivery Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{delivery.deliveryId}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tracking:</span> {delivery.trackingNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(delivery.status)}
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Resident Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Resident Details
                      </h4>
                      <div className="pl-6 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">Name:</span>{' '}
                          <span className="text-gray-800">
                            {delivery.resident?.firstName} {delivery.resident?.lastName}
                          </span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${delivery.resident?.email}`} className="text-blue-600 hover:underline">
                            {delivery.resident?.email}
                          </a>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${delivery.resident?.phone}`} className="text-blue-600 hover:underline">
                            {delivery.resident?.phone}
                          </a>
                        </p>
                        {delivery.resident?.address && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">
                                {typeof delivery.resident.address === 'string' 
                                  ? delivery.resident.address 
                                  : `${delivery.resident.address.street}, ${delivery.resident.address.city}, ${delivery.resident.address.state} ${delivery.resident.address.zipCode}`
                                }
                              </span>
                            </p>
                            <button
                              onClick={() => {
                                const addressStr = typeof delivery.resident?.address === 'string' 
                                  ? delivery.resident.address 
                                  : `${delivery.resident?.address?.street}, ${delivery.resident?.address?.city}, ${delivery.resident?.address?.state} ${delivery.resident?.address?.zipCode}`;
                                openInMaps(addressStr);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3" />
                              Open in Maps
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bin & Schedule Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Delivery Information
                      </h4>
                      <div className="pl-6 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">Bin:</span>{' '}
                          <span className="text-gray-800">{delivery.bin?.binId || 'Not assigned yet'}</span>
                        </p>
                        {delivery.bin?.binType && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-600">Type:</span>{' '}
                            <span className="text-gray-800 capitalize">{delivery.bin.binType}</span>
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">Scheduled:</span>{' '}
                          <span className="text-gray-800">
                            {delivery.scheduledDate
                              ? new Date(delivery.scheduledDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Not scheduled'}
                          </span>
                        </p>
                        {delivery.confirmedAt && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-600">Confirmed:</span>{' '}
                            <span className="text-green-600">
                              {new Date(delivery.confirmedAt).toLocaleString()}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Attempts */}
                  {delivery.attempts && delivery.attempts.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-700 mb-3">Delivery History</h4>
                      <div className="space-y-2">
                        {delivery.attempts.map((attempt, idx) => (
                          <div key={idx} className="flex gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">
                                {new Date(attempt.date).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-gray-600 mt-1">{attempt.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                    {delivery.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowStatusModal(true);
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        Update Status
                      </button>
                    )}
                    {delivery.status === 'delivered' && (
                      <div className="flex-1 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Delivery Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Update Delivery Status</h2>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Delivery:</span> {selectedDelivery.deliveryId}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tracking:</span> {selectedDelivery.trackingNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Resident:</span>{' '}
                    {selectedDelivery.resident?.firstName} {selectedDelivery.resident?.lastName}
                  </p>
                </div>

                <form onSubmit={handleUpdateStatus}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        name="status"
                        required
                        defaultValue={selectedDelivery.status}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="in-transit">🚚 In Transit</option>
                        <option value="delivered">✅ Delivered</option>
                        <option value="failed">❌ Failed</option>
                        <option value="rescheduled">🔄 Rescheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        name="note"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Add any notes about this delivery update..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusModal(false);
                        setSelectedDelivery(null);
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
