import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Package, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { binRequestService, type BinRequest } from '../services/binRequest.service';
import { useAuth } from '../contexts/AuthContext';

export const BinRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BinRequest | null>(null);

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['binRequests'],
    queryFn: () => binRequestService.getRequests()
  });

  const createMutation = useMutation({
    mutationFn: binRequestService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binRequests'] });
      setShowCreateModal(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      binRequestService.approveRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binRequests'] });
      setShowApproveModal(false);
      setSelectedRequest(null);
    }
  });

  const handleCreateRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      requestedBinType: formData.get('binType') as string,
      preferredDeliveryDate: formData.get('deliveryDate') as string,
      notes: formData.get('notes') as string
    });
  };

  const handleApprove = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const formData = new FormData(e.currentTarget);
    approveMutation.mutate({
      requestId: selectedRequest._id,
      data: {
        deliveryDate: formData.get('deliveryDate') as string
      }
    });
  };

  const requests = requestsData?.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Package className="w-8 h-8 text-emerald-600" />
              Bin Requests
            </h1>
            <p className="text-gray-600 mt-1">Request and manage smart bin assignments</p>
          </div>
          {user?.role === 'resident' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Request
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bin Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preferred Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request: BinRequest) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {request.resident?.firstName} {request.resident?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {request.requestedBinType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {request.preferredDeliveryDate
                        ? new Date(request.preferredDeliveryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="text-sm capitalize">{request.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user?.role === 'operator' || user?.role === 'admin' ? (
                        request.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Approve & Assign
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Request Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Request Smart Bin</h2>
              <form onSubmit={handleCreateRequest}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bin Type
                    </label>
                    <select
                      name="binType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="general">General Waste</option>
                      <option value="recyclable">Recyclable</option>
                      <option value="organic">Organic</option>
                      <option value="hazardous">Hazardous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Any special requirements..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Approve & Assign Bin</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Request: {selectedRequest.requestId}</p>
                <p className="text-sm text-gray-600">
                  Resident: {selectedRequest.resident?.firstName} {selectedRequest.resident?.lastName}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  Bin Type: {selectedRequest.requestedBinType}
                </p>
              </div>
              <form onSubmit={handleApprove}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      required
                      defaultValue={
                        selectedRequest.preferredDeliveryDate
                          ? new Date(selectedRequest.preferredDeliveryDate).toISOString().split('T')[0]
                          : ''
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve & Assign'}
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
