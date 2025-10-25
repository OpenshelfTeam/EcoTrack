import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Truck, Package, Calendar, CheckCircle, Clock, XCircle, Users } from 'lucide-react';
import { deliveryService, type Delivery } from '../services/delivery.service';
import { userService, type User } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

export const DeliveriesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const { data: deliveriesData, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => deliveryService.getDeliveries()
  });

  // Fetch collectors for reassignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'collector'],
    queryFn: () => userService.getAllUsers({ role: 'collector' }),
    enabled: user?.role === 'operator' || user?.role === 'admin'
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ deliveryId, data }: { deliveryId: string; data: any }) =>
      deliveryService.updateStatus(deliveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setShowStatusModal(false);
      setSelectedDelivery(null);
    }
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: (deliveryId: string) => deliveryService.confirmReceipt(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    }
  });

  const reassignMutation = useMutation({
    mutationFn: ({ deliveryId, collectorId }: { deliveryId: string; collectorId: string }) =>
      deliveryService.reassignCollector(deliveryId, { collectorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setShowReassignModal(false);
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

  const handleReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    const formData = new FormData(e.currentTarget);
    reassignMutation.mutate({
      deliveryId: selectedDelivery._id,
      collectorId: formData.get('collectorId') as string
    });
  };

  const deliveries = deliveriesData?.data || [];
  const collectors = usersData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600" />
            Deliveries
          </h1>
          <p className="text-gray-600 mt-1">Track smart bin deliveries</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {deliveries.map((delivery: Delivery) => (
              <div key={delivery._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{delivery.deliveryId}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          delivery.status
                        )}`}
                      >
                        {delivery.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tracking:</span> {delivery.trackingNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Bin:</span> {delivery.bin?.binId || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(delivery.status)}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Resident</p>
                      <p className="text-sm text-gray-600">
                        {delivery.resident?.firstName} {delivery.resident?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{delivery.resident?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Scheduled Date</p>
                      <p className="text-sm text-gray-600">
                        {delivery.scheduledDate
                          ? new Date(delivery.scheduledDate).toLocaleDateString()
                          : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Assigned Collector</p>
                      <p className="text-sm text-gray-600">
                        {delivery.deliveryTeam 
                          ? `${delivery.deliveryTeam.firstName} ${delivery.deliveryTeam.lastName}`
                          : 'Not assigned'}
                      </p>
                      {delivery.deliveryTeam && (
                        <p className="text-xs text-gray-500">{delivery.deliveryTeam.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {delivery.attempts && delivery.attempts.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Delivery Attempts</p>
                    <div className="space-y-2">
                      {delivery.attempts.map((attempt, idx) => (
                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">
                            {new Date(attempt.date).toLocaleString()}
                          </span>
                          : {attempt.note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {(user?.role === 'operator' || user?.role === 'admin') && delivery.status !== 'delivered' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowStatusModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowReassignModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Reassign Collector
                      </button>
                    </>
                  )}
                  {user?.role === 'collector' && delivery.status !== 'delivered' && (
                    <button
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setShowStatusModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Update Status
                    </button>
                  )}
                  {user?.role === 'resident' && delivery.status === 'in-transit' && (
                    <button
                      onClick={() => confirmReceiptMutation.mutate(delivery._id)}
                      disabled={confirmReceiptMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      {confirmReceiptMutation.isPending ? 'Confirming...' : 'Confirm Receipt'}
                    </button>
                  )}
                  {delivery.confirmedAt && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Confirmed at {new Date(delivery.confirmedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {deliveries.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No deliveries found</p>
              </div>
            )}
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Update Delivery Status</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Delivery: {selectedDelivery.deliveryId}</p>
                <p className="text-sm text-gray-600">
                  Tracking: {selectedDelivery.trackingNumber}
                </p>
              </div>
              <form onSubmit={handleUpdateStatus}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      required
                      defaultValue={selectedDelivery.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea
                      name="note"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add delivery notes..."
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reassign Collector Modal */}
        {showReassignModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Reassign Collector</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Delivery: {selectedDelivery.deliveryId}</p>
                <p className="text-sm text-gray-600">
                  Current Collector: {selectedDelivery.deliveryTeam 
                    ? `${selectedDelivery.deliveryTeam.firstName} ${selectedDelivery.deliveryTeam.lastName}`
                    : 'Not assigned'}
                </p>
              </div>
              <form onSubmit={handleReassign}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select New Collector
                    </label>
                    <select
                      name="collectorId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">-- Select a collector --</option>
                      {collectors.map((collector: User) => (
                        <option key={collector._id} value={collector._id}>
                          {collector.firstName} {collector.lastName} ({collector.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReassignModal(false);
                      setSelectedDelivery(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reassignMutation.isPending}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {reassignMutation.isPending ? 'Reassigning...' : 'Reassign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
