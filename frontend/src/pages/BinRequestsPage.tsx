import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Package, Plus, CheckCircle, XCircle, Clock, Navigation, Map, Loader2, X, Trash2, Calendar, MapPin, FileText } from 'lucide-react';
import { binRequestService, type BinRequest } from '../services/binRequest.service';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const BinRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BinRequest | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  // Location handling state
  const [gettingLocation, setGettingLocation] = useState(false);
  const [requestCoordinates, setRequestCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [requestAddress, setRequestAddress] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [tempMapCoordinates, setTempMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Scroll to top when modal opens
  useEffect(() => {
    if (showCreateModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showCreateModal]);

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
      notes: formData.get('notes') as string,
      address: requestAddress,
      coordinates: requestCoordinates || undefined
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter your address manually.');
      setTimeout(() => setLocationError(null), 5000);
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Clear any error messages immediately on success
        setLocationError(null);
        
        const { latitude, longitude } = position.coords;
        setRequestCoordinates({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          const data = await response.json();
          
          if (data.display_name) {
            setRequestAddress(data.display_name);
          } else {
            setRequestAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setRequestAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }

        setGettingLocation(false);
      },
      (error) => {
        // Only show error if location was not successfully retrieved
        // Add delay to let success callback run first (prevents false errors)
        setTimeout(() => {
          if (!requestCoordinates) {
            console.error('Error getting location:', error);
            
            // Provide specific error messages based on error code
            let errorMessage = '';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings and try again.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your device settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'Unable to get your location. Please enter your address manually.';
            }
            
            setLocationError(errorMessage);
            setTimeout(() => setLocationError(null), 8000); // Auto-hide after 8 seconds
          }
        }, 200); // Small delay to let success callback run first
        
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0
      }
    );
  };

  const openMapPicker = () => {
    setTempMapCoordinates(requestCoordinates || { lat: 6.9271, lng: 79.8612 }); // Default to Colombo
    setShowMapPicker(true);
  };

  const confirmMapLocation = async () => {
    if (tempMapCoordinates) {
      setRequestCoordinates(tempMapCoordinates);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempMapCoordinates.lat}&lon=${tempMapCoordinates.lng}`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        const data = await response.json();
        
        if (data.display_name) {
          setRequestAddress(data.display_name);
        } else {
          setRequestAddress(`Location: ${tempMapCoordinates.lat.toFixed(6)}, ${tempMapCoordinates.lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Error getting address:', error);
        setRequestAddress(`Location: ${tempMapCoordinates.lat.toFixed(6)}, ${tempMapCoordinates.lng.toFixed(6)}`);
      }
      
      setShowMapPicker(false);
    }
  };

  // Component for handling map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setTempMapCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setRequestAddress('');
              setRequestCoordinates(null);
            }
          }}>
            <div className="min-h-screen py-6 px-4 flex justify-center">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto transform transition-all animate-fadeIn">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Request Smart Bin</h2>
                        <p className="text-emerald-50 text-sm mt-1">Fill in the details to request a new bin</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setRequestAddress('');
                        setRequestCoordinates(null);
                      }}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleCreateRequest} className="p-8">
                <div className="space-y-6">
                  {/* Bin Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-emerald-600" />
                      Bin Type
                    </label>
                    <select
                      name="binType"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white cursor-pointer text-gray-900 font-medium"
                    >
                      <option value="general">🗑️ General Waste</option>
                      <option value="recyclable">♻️ Recyclable</option>
                      <option value="organic">🌱 Organic</option>
                      <option value="hazardous">⚠️ Hazardous</option>
                    </select>
                  </div>

                  {/* Preferred Delivery Date */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Preferred Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white"
                    />
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Delivery Address *
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={requestAddress}
                        onChange={(e) => setRequestAddress(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white"
                        placeholder="Full address including district"
                        required
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                          title="Use my current location"
                        >
                          {gettingLocation ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-5 h-5" />
                              Use GPS Location
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={openMapPicker}
                          className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                          title="Select location on map"
                        >
                          <Map className="w-5 h-5" />
                          Pick on Map
                        </button>
                      </div>
                    </div>
                    {requestCoordinates && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl animate-fadeIn">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Location Captured Successfully!</p>
                            <p className="text-xs text-emerald-600 mt-1 font-mono">
                              📍 {requestCoordinates.lat.toFixed(6)}, {requestCoordinates.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {locationError && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl animate-fadeIn">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">Location Access Error</p>
                            <p className="text-xs text-red-600 mt-1">{locationError}</p>
                            {locationError.includes('denied') && (
                              <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded-lg">
                                <p className="font-semibold mb-1">To enable location access:</p>
                                <ol className="list-decimal ml-4 space-y-0.5">
                                  <li>Click the 🔒 lock icon in your browser address bar</li>
                                  <li>Allow location permissions for this site</li>
                                  <li>Refresh the page and try again</li>
                                </ol>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setLocationError(null)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none bg-gray-50 hover:bg-white"
                      placeholder="Any special requirements or additional information..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setRequestAddress('');
                      setRequestCoordinates(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
              </div>
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

        {/* Map Picker Modal */}
        {showMapPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
              {/* Map Picker Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Pick Delivery Location</h2>
                    <p className="text-purple-50 text-sm">Click on the map to select your location</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Map Container */}
              <div className="flex-1 relative">
                <MapContainer
                  center={[tempMapCoordinates?.lat || 6.9271, tempMapCoordinates?.lng || 79.8612]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler />
                  {tempMapCoordinates && (
                    <Marker position={[tempMapCoordinates.lat, tempMapCoordinates.lng]} />
                  )}
                </MapContainer>

                {/* Coordinates Display */}
                {tempMapCoordinates && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg z-[1000]">
                    <p className="text-sm font-semibold text-gray-800">Selected Location</p>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      📍 {tempMapCoordinates.lat.toFixed(6)}, {tempMapCoordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Map Picker Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMapLocation}
                  disabled={!tempMapCoordinates}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
