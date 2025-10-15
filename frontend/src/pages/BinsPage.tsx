import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  Trash2, Plus, Search, Filter, MapPin, Edit, Trash,
  CheckCircle, AlertCircle, Clock, Map, List, X
} from 'lucide-react';
import { binService } from '../services/bin.service';

interface Bin {
  id: string;
  location: string;
  address: string;
  capacity: number;
  currentLevel: number;
  status: 'active' | 'full' | 'maintenance' | 'inactive';
  type: 'general' | 'recyclable' | 'organic' | 'hazardous';
  lastCollection: string;
  nextCollection: string;
  coordinates?: { lat: number; lng: number };
}

type ViewMode = 'list' | 'grid' | 'map';

export const BinsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch bins with filters
  const { data: binsData, isLoading, error } = useQuery({
    queryKey: ['bins', { search: searchTerm, status: filterStatus, type: filterType }],
    queryFn: () => binService.getAllBins({
      search: searchTerm,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      wasteType: filterType !== 'all' ? filterType : undefined,
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

  // Bins are already filtered by the API query
  const filteredBins = bins;

  // Statistics
  const stats = {
    total: bins.length,
    active: bins.filter(b => b.status === 'active').length,
    full: bins.filter(b => b.status === 'full').length,
    maintenance: bins.filter(b => b.status === 'maintenance').length,
    averageLevel: Math.round(bins.reduce((sum, b) => sum + b.currentLevel, 0) / bins.length)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'full': return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
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
      case 'full': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAddBin = () => {
    createBinMutation.mutate({
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271], // Default Colombo coordinates
        address: newBin.address,
      },
      capacity: newBin.capacity,
      binType: newBin.type,
      currentLevel: newBin.currentLevel,
      status: newBin.status,
      lastEmptied: newBin.lastCollection ? new Date(newBin.lastCollection) : null,
    });
  };

  const handleEditBin = () => {
    if (selectedBin) {
      updateBinMutation.mutate({
        id: selectedBin.id,
        data: {
          location: {
            type: 'Point',
            coordinates: [79.8612, 6.9271],
            address: selectedBin.address,
          },
          capacity: selectedBin.capacity,
          binType: selectedBin.type,
          currentLevel: selectedBin.currentLevel,
          status: selectedBin.status,
        },
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
              Waste Bins Management
            </h1>
            <p className="text-gray-600 mt-1">Monitor and manage all waste collection bins</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add New Bin
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{bin.location}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {bin.address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(bin.type)}`}>
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
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{bin.location}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {bin.address}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Bin</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewBin();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                  <input
                    type="text"
                    value={newBin.location}
                    onChange={(e) => setNewBin({ ...newBin, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Central Park North"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={newBin.type}
                    onChange={(e) => setNewBin({ ...newBin, type: e.target.value as Bin['type'] })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="general">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={newBin.address}
                  onChange={(e) => setNewBin({ ...newBin, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Full address including district"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (L) *</label>
                  <input
                    type="number"
                    value={newBin.capacity}
                    onChange={(e) => setNewBin({ ...newBin, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Level (%)</label>
                  <input
                    type="number"
                    value={newBin.currentLevel}
                    onChange={(e) => setNewBin({ ...newBin, currentLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={newBin.status}
                    onChange={(e) => setNewBin({ ...newBin, status: e.target.value as Bin['status'] })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Collection</label>
                  <input
                    type="date"
                    value={newBin.lastCollection}
                    onChange={(e) => setNewBin({ ...newBin, lastCollection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Collection</label>
                  <input
                    type="date"
                    value={newBin.nextCollection}
                    onChange={(e) => setNewBin({ ...newBin, nextCollection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewBin();
                }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBin}
                disabled={!newBin.location || !newBin.address}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bin Modal */}
      {showEditModal && selectedBin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Bin</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBin(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                  <input
                    type="text"
                    value={selectedBin.location}
                    onChange={(e) => setSelectedBin({ ...selectedBin, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={selectedBin.type}
                    onChange={(e) => setSelectedBin({ ...selectedBin, type: e.target.value as Bin['type'] })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="general">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={selectedBin.address}
                  onChange={(e) => setSelectedBin({ ...selectedBin, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (L) *</label>
                  <input
                    type="number"
                    value={selectedBin.capacity}
                    onChange={(e) => setSelectedBin({ ...selectedBin, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Level (%)</label>
                  <input
                    type="number"
                    value={selectedBin.currentLevel}
                    onChange={(e) => setSelectedBin({ ...selectedBin, currentLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={selectedBin.status}
                    onChange={(e) => setSelectedBin({ ...selectedBin, status: e.target.value as Bin['status'] })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Collection</label>
                  <input
                    type="date"
                    value={selectedBin.lastCollection}
                    onChange={(e) => setSelectedBin({ ...selectedBin, lastCollection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Collection</label>
                  <input
                    type="date"
                    value={selectedBin.nextCollection}
                    onChange={(e) => setSelectedBin({ ...selectedBin, nextCollection: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBin(null);
                }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBin}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
