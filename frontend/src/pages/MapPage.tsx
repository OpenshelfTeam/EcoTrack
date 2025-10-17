import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin, Truck, CheckCircle, AlertCircle, X,
  Map as MapIcon, Loader2, Trash2, Search, SlidersHorizontal,
  Navigation, Eye, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { binService, type SmartBin } from '../services/bin.service';

// Fix Leaflet default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons based on fill level
const createBinIcon = (fillLevel: number, status: string) => {
  let color = '#10b981'; // green - empty/low
  let icon = '📦';
  
  if (status === 'inactive' || status === 'damaged') {
    color = '#ef4444'; // red
    icon = '🚫';
  } else if (fillLevel >= 80) {
    color = '#dc2626'; // dark red - critical
    icon = '🔴';
  } else if (fillLevel >= 60) {
    color = '#f59e0b'; // orange - high
    icon = '🟠';
  } else if (fillLevel >= 40) {
    color = '#eab308'; // yellow - medium
    icon = '🟡';
  } else {
    color = '#10b981'; // green - low
    icon = '🟢';
  }
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <span style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));">${icon}</span>
      </div>
    `,
    className: 'custom-bin-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Component to auto-fit map bounds (disabled to keep full Sri Lanka view)
const MapBoundsSetter = ({ bins }: { bins: SmartBin[] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Keep the default full Sri Lanka view - don't auto-zoom to bins
    // This ensures the map always shows the complete island
    map.setView([7.8731, 80.7718], 7.5);
  }, [map]);
  
  return null;
};

export const MapPage = () => {
  const { user } = useAuth();
  
  // Filter states
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBin, setSelectedBin] = useState<SmartBin | null>(null);
  const [showBinDetails, setShowBinDetails] = useState(false);

  // Fetch all bins with auto-refresh capabilities
  const { data: binsData, isLoading: loadingBins, error: binsError, refetch } = useQuery({
    queryKey: ['bins'],
    queryFn: () => binService.getAllBins({ view: 'map', limit: 1000 }), // Get all bins for map view
    refetchOnWindowFocus: true, // Auto-refetch when user returns to tab
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Debug: Log the response to see the structure
  console.log('Bins Data:', binsData);
  console.log('Bins Error:', binsError);

  const bins = binsData?.data?.bins || binsData?.data || [];

  // Filter bins based on criteria
  const filteredBins = bins.filter((bin: SmartBin) => {
    // Capacity filter
    const fillPercentage = (bin.currentLevel / bin.capacity) * 100;
    let passCapacityFilter = true;
    
    if (capacityFilter === 'critical' && fillPercentage < 80) passCapacityFilter = false;
    if (capacityFilter === 'high' && (fillPercentage < 60 || fillPercentage >= 80)) passCapacityFilter = false;
    if (capacityFilter === 'medium' && (fillPercentage < 40 || fillPercentage >= 60)) passCapacityFilter = false;
    if (capacityFilter === 'low' && fillPercentage >= 40) passCapacityFilter = false;

    // Status filter
    const passStatusFilter = statusFilter === 'all' || bin.status === statusFilter;

    // Search filter
    const passSearchFilter = !searchTerm || 
      bin.binId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.binType?.toLowerCase().includes(searchTerm.toLowerCase());

    return passCapacityFilter && passStatusFilter && passSearchFilter;
  });

  // Calculate stats
  const stats = {
    total: filteredBins.length,
    critical: filteredBins.filter((b: SmartBin) => (b.currentLevel / b.capacity) * 100 >= 80).length,
    high: filteredBins.filter((b: SmartBin) => {
      const fill = (b.currentLevel / b.capacity) * 100;
      return fill >= 60 && fill < 80;
    }).length,
    medium: filteredBins.filter((b: SmartBin) => {
      const fill = (b.currentLevel / b.capacity) * 100;
      return fill >= 40 && fill < 60;
    }).length,
    low: filteredBins.filter((b: SmartBin) => (b.currentLevel / b.capacity) * 100 < 40).length,
  };

  if (loadingBins) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading map...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <MapIcon className="w-7 h-7" />
              </div>
              {user?.role === 'resident' ? 'My Bins Map' : 'Bin Location Map'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'resident' 
                ? 'Track your registered waste bins and collection status • Auto-updates every 30s'
                : 'Real-time waste bin monitoring and collection planning • Auto-updates every 30s'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              disabled={loadingBins}
              className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh bin locations"
            >
              <RefreshCw className={`w-5 h-5 ${loadingBins ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <button
            onClick={() => setCapacityFilter(capacityFilter === 'critical' ? 'all' : 'critical')}
            className={`bg-white rounded-xl p-5 border-2 transition-all text-left ${
              capacityFilter === 'critical' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical (≥80%)</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
              </div>
              <div className={`p-3 rounded-lg ${capacityFilter === 'critical' ? 'bg-red-200' : 'bg-red-100'}`}>
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setCapacityFilter(capacityFilter === 'high' ? 'all' : 'high')}
            className={`bg-white rounded-xl p-5 border-2 transition-all text-left ${
              capacityFilter === 'high' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High (60-79%)</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.high}</p>
              </div>
              <div className={`p-3 rounded-lg ${capacityFilter === 'high' ? 'bg-orange-200' : 'bg-orange-100'}`}>
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setCapacityFilter(capacityFilter === 'medium' ? 'all' : 'medium')}
            className={`bg-white rounded-xl p-5 border-2 transition-all text-left ${
              capacityFilter === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium (40-59%)</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.medium}</p>
              </div>
              <div className={`p-3 rounded-lg ${capacityFilter === 'medium' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setCapacityFilter(capacityFilter === 'low' ? 'all' : 'low')}
            className={`bg-white rounded-xl p-5 border-2 transition-all text-left ${
              capacityFilter === 'low' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low (&lt;40%)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.low}</p>
              </div>
              <div className={`p-3 rounded-lg ${capacityFilter === 'low' ? 'bg-emerald-200' : 'bg-emerald-100'}`}>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Bins</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by ID, address, type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bin Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCapacityFilter('all');
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
          <div className="relative" style={{ height: '600px' }}>
            {filteredBins.length > 0 ? (
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
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapBoundsSetter bins={filteredBins} />
                
                {filteredBins.map((bin: SmartBin) => {
                  if (!bin.location?.coordinates || bin.location.coordinates.length !== 2) return null;
                  
                  const fillPercentage = (bin.currentLevel / bin.capacity) * 100;
                  
                  return (
                    <Marker
                      key={bin._id}
                      position={[bin.location.coordinates[1], bin.location.coordinates[0]]}
                      icon={createBinIcon(fillPercentage, bin.status)}
                      eventHandlers={{
                        click: () => {
                          setSelectedBin(bin);
                          setShowBinDetails(true);
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[250px]">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900">{bin.binId}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bin.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              bin.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {bin.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-xs">{bin.location.address || 'No address'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-600">
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs">{bin.binType}</span>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Fill Level</span>
                                <span className="font-bold">{fillPercentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    fillPercentage >= 80 ? 'bg-red-600' :
                                    fillPercentage >= 60 ? 'bg-orange-500' :
                                    fillPercentage >= 40 ? 'bg-yellow-500' :
                                    'bg-emerald-500'
                                  }`}
                                  style={{ width: `${fillPercentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {bin.currentLevel}L / {bin.capacity}L
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setSelectedBin(bin);
                                setShowBinDetails(true);
                              }}
                              className="w-full mt-2 px-3 py-1.5 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md">
                  <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  {user?.role === 'resident' ? (
                    <>
                      <p className="text-gray-900 font-semibold text-lg mb-2">No Bins Registered Yet</p>
                      <p className="text-gray-600 mb-4">
                        You haven't registered any waste bins yet. Add your first bin to start tracking waste collection.
                      </p>
                      <a
                        href="/bins"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
                      >
                        Add Your First Bin
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">No bins found matching your filters</p>
                      <button
                        onClick={() => {
                          setCapacityFilter('all');
                          setStatusFilter('all');
                          setSearchTerm('');
                        }}
                        className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Reset Filters
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-10 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Fill Level Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span>Critical (≥80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>High (60-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>Medium (40-59%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  <span>Low (&lt;40%)</span>
                </div>
              </div>
            </div>

            {/* Map Controls Info */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10 border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Navigation className="w-4 h-4" />
                <span>Click markers for details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bin Details Modal */}
        {showBinDetails && selectedBin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 transform transition-all animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Trash2 className="h-6 w-6 text-blue-600" />
                  </div>
                  Bin Details
                </h3>
                <button
                  onClick={() => {
                    setShowBinDetails(false);
                    setSelectedBin(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="text-2xl text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Bin ID and Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Bin ID</p>
                    <p className="text-xl font-bold text-gray-900">{selectedBin.binId}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedBin.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    selectedBin.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedBin.status}
                  </span>
                </div>

                {/* Fill Level */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">Fill Level</h4>
                    <span className="text-2xl font-bold text-gray-900">
                      {((selectedBin.currentLevel / selectedBin.capacity) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        (selectedBin.currentLevel / selectedBin.capacity) * 100 >= 80 ? 'bg-red-600' :
                        (selectedBin.currentLevel / selectedBin.capacity) * 100 >= 60 ? 'bg-orange-500' :
                        (selectedBin.currentLevel / selectedBin.capacity) * 100 >= 40 ? 'bg-yellow-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${(selectedBin.currentLevel / selectedBin.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedBin.currentLevel}L / {selectedBin.capacity}L capacity
                  </p>
                </div>

                {/* Location */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedBin.location.address || 'No address available'}
                      </p>
                      {selectedBin.location.coordinates && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedBin.location.coordinates[1].toFixed(6)}, {selectedBin.location.coordinates[0].toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bin Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Bin Type</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBin.binType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBin.capacity}L</p>
                  </div>
                </div>

                {/* Last Emptied */}
                {selectedBin.lastEmptied && (
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-gray-900">Last Emptied</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(selectedBin.lastEmptied).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code & RFID */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedBin.qrCode && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 uppercase">QR Code</p>
                      <p className="text-sm font-mono text-gray-900 mt-1">{selectedBin.qrCode}</p>
                    </div>
                  )}
                  {selectedBin.rfidTag && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 uppercase">RFID Tag</p>
                      <p className="text-sm font-mono text-gray-900 mt-1">{selectedBin.rfidTag}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    // Navigate to bin in map
                    setShowBinDetails(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
