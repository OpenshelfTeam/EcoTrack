import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Trash2, Plus, Search, Filter, MapPin, Edit, Trash,
  CheckCircle, AlertCircle, Clock, Map, List, X, Loader2, Navigation
} from 'lucide-react';
import { binService } from '../services/bin.service';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }: { position: { lat: number; lng: number } | null; setPosition: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} />
  );
}

interface Bin {
  id: string;
  binId: string;
  location: string;
  address: string;
  capacity: number;
  currentLevel: number;
  status: 'available' | 'assigned' | 'in-transit' | 'active' | 'maintenance' | 'damaged' | 'full' | 'inactive';
  type: 'general' | 'recyclable' | 'organic' | 'hazardous';
  lastCollection: string;
  nextCollection: string;
  coordinates?: { lat: number; lng: number };
}

type ViewMode = 'list' | 'grid' | 'map';

export const BinsPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState<{ lat: number; lng: number } | null>(null);

  const queryClient = useQueryClient();

  // Fetch bins with filters
  const { data: binsData, isLoading, error } = useQuery({
    queryKey: ['bins', { search: searchTerm, status: filterStatus, type: filterType }],
    queryFn: () => binService.getAllBins({
      search: searchTerm,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      wasteType: filterType !== 'all' ? filterType : undefined,
      limit: 1000, // Get up to 1000 bins to show all
    }),
  });

  // Create bin mutation
  const createBinMutation = useMutation({
    mutationFn: binService.createBin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bins'] });
      setShowAddModal(false);
      resetNewBin();
    },
    onError: (error: any) => {
      alert(`Error creating bin: ${error.response?.data?.message || error.message}`);
      console.error('Bin creation error:', error.response?.data);
    },
  });

  // Update bin mutation
  const updateBinMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => binService.updateBin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bins'] });
      setShowEditModal(false);
      setSelectedBin(null);
    },
    onError: (error: any) => {
      alert(`Error updating bin: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete bin mutation
  const deleteBinMutation = useMutation({
    mutationFn: binService.deleteBin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bins'] });
    },
    onError: (error: any) => {
      alert(`Error deleting bin: ${error.response?.data?.message || error.message}`);
    },
  });

  const bins: Bin[] = binsData?.data?.map((bin: any) => ({
    id: bin._id,
    binId: bin.binId,
    location: bin.location?.address || 'Unknown Location',
    address: bin.location?.address || '',
    capacity: bin.capacity,
    currentLevel: bin.currentLevel,
    status: bin.status,
    type: bin.binType,
    lastCollection: bin.lastEmptied ? new Date(bin.lastEmptied).toISOString().split('T')[0] : 'Never',
    nextCollection: bin.nextScheduledCollection ? new Date(bin.nextScheduledCollection).toISOString().split('T')[0] : 'Not scheduled',
    coordinates: bin.location?.coordinates ? { lat: bin.location.coordinates[1], lng: bin.location.coordinates[0] } : undefined
  })) || [];

  const [newBin, setNewBin] = useState<Partial<Bin>>({
    location: '',
    address: '',
    capacity: 100,
    currentLevel: 0,
    status: 'active',
    type: 'general',
    lastCollection: new Date().toISOString().split('T')[0],
    nextCollection: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [gettingLocation, setGettingLocation] = useState(false);
  const [binCoordinates, setBinCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Bins are already filtered by the API query
  const filteredBins = bins;

  // Statistics
  const stats = {
    total: bins.length,
    active: bins.filter(b => b.status === 'active' || b.status === 'available' || b.status === 'assigned').length,
    full: bins.filter(b => b.status === 'full' || b.currentLevel >= 80).length,
    maintenance: bins.filter(b => b.status === 'maintenance' || b.status === 'damaged').length,
    averageLevel: bins.length > 0 ? Math.round(bins.reduce((sum, b) => sum + b.currentLevel, 0) / bins.length) : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'available': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'assigned': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'in-transit': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'full': return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'damaged': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-gray-100 text-gray-700';
      case 'recyclable': return 'bg-blue-100 text-blue-700';
      case 'organic': return 'bg-green-100 text-green-700';
      case 'hazardous': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 80) return 'bg-red-500';
    if (level >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'assigned': return <CheckCircle className="w-4 h-4" />;
      case 'in-transit': return <Clock className="w-4 h-4" />;
      case 'full': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      case 'damaged': return <AlertCircle className="w-4 h-4" />;
      case 'inactive': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAddBin = () => {
    // Use captured coordinates or default to Colombo
    const coords = binCoordinates 
      ? [binCoordinates.lng, binCoordinates.lat] 
      : [79.8612, 6.9271];

    createBinMutation.mutate({
      location: {
        type: 'Point',
        coordinates: coords,
        address: newBin.address,
      },
      capacity: newBin.capacity,
      binType: newBin.type,
      currentLevel: newBin.currentLevel,
      status: newBin.status,
      lastEmptied: newBin.lastCollection ? new Date(newBin.lastCollection) : null,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setBinCoordinates({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setNewBin({ ...newBin, address: data.display_name });
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setNewBin({ 
            ...newBin, 
            address: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          });
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please ensure location permissions are enabled.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMapLocationSelect = async () => {
    if (tempMapLocation) {
      setBinCoordinates(tempMapLocation);

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempMapLocation.lat}&lon=${tempMapLocation.lng}`
        );
        const data = await response.json();
        
        if (data.display_name) {
          setNewBin({ ...newBin, address: data.display_name });
        }
      } catch (error) {
        console.error('Error getting address:', error);
        setNewBin({ 
          ...newBin, 
          address: `Location: ${tempMapLocation.lat.toFixed(6)}, ${tempMapLocation.lng.toFixed(6)}` 
        });
      }

      setShowMapPicker(false);
      setTempMapLocation(null);
    }
  };

  const handleEditBin = () => {
    if (selectedBin) {
      // Residents can only update specific fields
      const updateData = user?.role === 'resident' 
        ? {
            currentLevel: selectedBin.currentLevel,
            status: selectedBin.status,
            lastEmptied: selectedBin.lastCollection ? new Date(selectedBin.lastCollection) : null,
          }
        : {
            location: {
              type: 'Point',
              coordinates: [79.8612, 6.9271],
              address: selectedBin.address,
            },
            capacity: selectedBin.capacity,
            binType: selectedBin.type,
            currentLevel: selectedBin.currentLevel,
            status: selectedBin.status,
            lastEmptied: selectedBin.lastCollection ? new Date(selectedBin.lastCollection) : null,
          };

      updateBinMutation.mutate({
        id: selectedBin.id,
        data: updateData,
      });
    }
  };

  const handleDeleteBin = (id: string) => {
    if (confirm('Are you sure you want to delete this bin?')) {
      deleteBinMutation.mutate(id);
    }
  };

  const resetNewBin = () => {
    setNewBin({
      location: '',
      address: '',
      capacity: 100,
      currentLevel: 0,
      status: 'active',
      type: 'general',
      lastCollection: new Date().toISOString().split('T')[0],
      nextCollection: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setBinCoordinates(null);
    setGettingLocation(false);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <Trash2 className="w-7 h-7" />
              </div>
              {user?.role === 'resident' ? 'My Assigned Bins' : 'Waste Bins Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'resident' 
                ? 'View your assigned waste bins. Need a new bin? Go to Bin Requests page.'
                : 'Monitor and manage all waste collection bins in the system'
              }
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'operator' || user?.role === 'authority') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add New Bin
            </button>
          )}
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
            <p className="font-medium">Error loading bins</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Full</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.full}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.maintenance}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Level</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageLevel}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-purple-600" />
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
                placeholder="Search by location or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'map' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>
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
                  <option value="active">Active</option>
                  <option value="full">Full</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="general">General Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Bins Display - Grid View */}
        {!isLoading && !error && (
        <>
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBins.map((bin) => (
              <div
                key={bin.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{bin.location}</h3>
                        <span className="px-2.5 py-1 bg-white text-emerald-700 text-xs font-mono font-bold rounded-md border border-emerald-300 shadow-sm whitespace-nowrap">
                          {bin.binId}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bin.address}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getTypeColor(bin.type)}`}>
                      {bin.type}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Fill Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Fill Level</span>
                      <span className={`text-sm font-bold ${
                        bin.currentLevel >= 80 ? 'text-red-600' : bin.currentLevel >= 60 ? 'text-yellow-600' : 'text-emerald-600'
                      }`}>
                        {bin.currentLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getLevelColor(bin.currentLevel)}`}
                        style={{ width: `${bin.currentLevel}%` }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(bin.status)}`}>
                      {getStatusIcon(bin.status)}
                      {bin.status}
                    </span>
                  </div>

                  {/* Collection Info */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Collection</span>
                      <span className="font-medium text-gray-900">{bin.lastCollection}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Collection</span>
                      <span className="font-medium text-emerald-600">{bin.nextCollection}</span>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Capacity</span>
                    <span className="text-sm font-medium text-gray-900">{bin.capacity}L</span>
                  </div>

                  {/* Damage Warning */}
                  {(bin.status === 'maintenance' || bin.status === 'damaged') && (
                    <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-800">⚠️ Bin Damaged</p>
                          <p className="text-xs text-red-700 mt-1">
                            This bin is damaged and needs replacement. Our team has been notified and will contact you soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="bg-gray-50 px-5 py-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedBin(bin);
                      setShowEditModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBin(bin.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bins Display - List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bin ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fill Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Next Collection</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBins.map((bin) => (
                    <tr key={bin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 bg-white text-emerald-700 text-xs font-mono font-bold rounded-md border border-emerald-300 shadow-sm">
                          {bin.binId}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{bin.location}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{bin.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(bin.type)}`}>
                          {bin.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(bin.status)}`}>
                          {getStatusIcon(bin.status)}
                          {bin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className={`h-full rounded-full transition-all ${getLevelColor(bin.currentLevel)}`}
                              style={{ width: `${bin.currentLevel}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            bin.currentLevel >= 80 ? 'text-red-600' : bin.currentLevel >= 60 ? 'text-yellow-600' : 'text-emerald-600'
                          }`}>
                            {bin.currentLevel}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{bin.capacity}L</td>
                      <td className="px-6 py-4 text-sm text-emerald-600 font-medium">{bin.nextCollection}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBin(bin);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBin(bin.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-6 bg-emerald-100 rounded-full">
                <Map className="w-16 h-16 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Map View</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Interactive map view with bin locations will be displayed here. 
                Integration with mapping services like Google Maps or Leaflet.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto mt-6">
                <p className="text-sm text-gray-600">
                  <strong>Features to implement:</strong><br/>
                  • Real-time bin locations on map<br/>
                  • Color-coded markers based on fill level<br/>
                  • Clickable markers showing bin details<br/>
                  • Route optimization visualization
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredBins.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bins found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
        </>
        )}
      </div>

      {/* Add Bin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 transform transition-all animate-fadeIn">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add New Bin</h2>
                    <p className="text-emerald-50 text-sm mt-1">Create a new smart waste bin</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewBin();
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location Name *</label>
                  <input
                    type="text"
                    value={newBin.location}
                    onChange={(e) => setNewBin({ ...newBin, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="e.g., Central Park North"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                  <select
                    value={newBin.type}
                    onChange={(e) => setNewBin({ ...newBin, type: e.target.value as Bin['type'] })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="general">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Address *</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newBin.address}
                    onChange={(e) => setNewBin({ ...newBin, address: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="Full address including district"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-semibold"
                    title="Use my current location"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Getting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-5 h-5" />
                        GPS
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg font-semibold"
                    title="Select location on map"
                  >
                    <Map className="w-5 h-5" />
                    Map
                  </button>
                </div>
                {binCoordinates && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    Location captured: {binCoordinates.lat.toFixed(6)}, {binCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Capacity (L) *</label>
                  <input
                    type="number"
                    value={newBin.capacity}
                    onChange={(e) => setNewBin({ ...newBin, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Current Level (%)</label>
                  <input
                    type="number"
                    value={newBin.currentLevel}
                    onChange={(e) => setNewBin({ ...newBin, currentLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status *</label>
                  <select
                    value={newBin.status}
                    onChange={(e) => setNewBin({ ...newBin, status: e.target.value as Bin['status'] })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Collection</label>
                  <input
                    type="date"
                    value={newBin.lastCollection}
                    onChange={(e) => setNewBin({ ...newBin, lastCollection: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Next Collection</label>
                  <input
                    type="date"
                    value={newBin.nextCollection}
                    onChange={(e) => setNewBin({ ...newBin, nextCollection: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-8 py-5 rounded-b-3xl border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewBin();
                  }}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBin}
                  disabled={!newBin.location || !newBin.address}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  Add Bin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bin Modal */}
      {showEditModal && selectedBin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 transform transition-all animate-fadeIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Edit className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold text-white">Edit Bin</h2>
                      <span className="inline-flex items-center px-3 py-1.5 bg-white/90 backdrop-blur-sm text-emerald-700 text-sm font-mono font-bold rounded-lg border-2 border-white shadow-lg">
                        {selectedBin.binId}
                      </span>
                    </div>
                    <p className="text-blue-50 text-sm mt-1.5">{selectedBin.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBin(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Show different fields based on user role */}
              {user?.role === 'resident' ? (
                // Residents can only edit limited fields
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You can update the current level, status, and last collection date for your bin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Current Level (%)</label>
                      <input
                        type="number"
                        value={selectedBin.currentLevel}
                        onChange={(e) => setSelectedBin({ ...selectedBin, currentLevel: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status *</label>
                      <select
                        value={selectedBin.status}
                        onChange={(e) => setSelectedBin({ ...selectedBin, status: e.target.value as Bin['status'] })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="full">Full</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Collection</label>
                    <input
                      type="date"
                      value={selectedBin.lastCollection}
                      onChange={(e) => setSelectedBin({ ...selectedBin, lastCollection: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </>
              ) : (
                // Operators/Admins can edit all fields
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location Name *</label>
                      <input
                        type="text"
                        value={selectedBin.location}
                        onChange={(e) => setSelectedBin({ ...selectedBin, location: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                      <select
                        value={selectedBin.type}
                        onChange={(e) => setSelectedBin({ ...selectedBin, type: e.target.value as Bin['type'] })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="general">General Waste</option>
                        <option value="recyclable">Recyclable</option>
                        <option value="organic">Organic</option>
                        <option value="hazardous">Hazardous</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Address *</label>
                    <input
                      type="text"
                      value={selectedBin.address}
                      onChange={(e) => setSelectedBin({ ...selectedBin, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Capacity (L) *</label>
                      <input
                        type="number"
                        value={selectedBin.capacity}
                        onChange={(e) => setSelectedBin({ ...selectedBin, capacity: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Current Level (%)</label>
                      <input
                        type="number"
                        value={selectedBin.currentLevel}
                        onChange={(e) => setSelectedBin({ ...selectedBin, currentLevel: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status *</label>
                      <select
                        value={selectedBin.status}
                        onChange={(e) => setSelectedBin({ ...selectedBin, status: e.target.value as Bin['status'] })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="full">Full</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Last Collection</label>
                      <input
                        type="date"
                        value={selectedBin.lastCollection}
                        onChange={(e) => setSelectedBin({ ...selectedBin, lastCollection: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Next Collection</label>
                      <input
                        type="date"
                        value={selectedBin.nextCollection}
                        onChange={(e) => setSelectedBin({ ...selectedBin, nextCollection: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-8 py-5 rounded-b-3xl border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBin(null);
                  }}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBin}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Location Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col transform transition-all animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Map className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Select Location on Map</h2>
                    <p className="text-purple-50 text-sm mt-1">Click anywhere on the map to set bin location</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMapPicker(false);
                    setTempMapLocation(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <MapContainer
                center={[7.8731, 80.7718]} // Center of Sri Lanka
                zoom={7.5}
                minZoom={7}
                maxZoom={18}
                maxBounds={[
                  [5.5, 79.0],  // Southwest - extended to show only ocean
                  [10.2, 82.5]  // Northeast - extended to show only ocean
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }}
                className="rounded-b-3xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={tempMapLocation} setPosition={setTempMapLocation} />
              </MapContainer>

              {/* Floating info card */}
              {tempMapLocation && (
                <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 z-[1000]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Selected Location</p>
                      <p className="text-lg font-bold text-purple-600">
                        {tempMapLocation.lat.toFixed(6)}, {tempMapLocation.lng.toFixed(6)}
                      </p>
                    </div>
                    <button
                      onClick={handleMapLocationSelect}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      Confirm Location
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions overlay */}
              {!tempMapLocation && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-4 z-[1000]">
                  <p className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    Click on the map to select a location
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
