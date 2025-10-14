import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  Trash2, Plus, Search, Filter, MapPin, Edit, Trash,
  CheckCircle, AlertCircle, Clock, Map, List, X
} from 'lucide-react';

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

  // Mock data - Replace with API call
  const [bins, setBins] = useState<Bin[]>([
    {
      id: '1',
      location: 'Central Park North',
      address: '123 Park Ave, District 1',
      capacity: 100,
      currentLevel: 85,
      status: 'full',
      type: 'general',
      lastCollection: '2024-10-12',
      nextCollection: '2024-10-15',
      coordinates: { lat: 40.7829, lng: -73.9654 }
    },
    {
      id: '2',
      location: 'Market Street',
      address: '456 Market St, District 2',
      capacity: 100,
      currentLevel: 45,
      status: 'active',
      type: 'recyclable',
      lastCollection: '2024-10-13',
      nextCollection: '2024-10-16',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    {
      id: '3',
      location: 'Riverside Plaza',
      address: '789 River Rd, District 1',
      capacity: 150,
      currentLevel: 92,
      status: 'full',
      type: 'organic',
      lastCollection: '2024-10-11',
      nextCollection: '2024-10-14',
      coordinates: { lat: 40.7480, lng: -73.9682 }
    },
    {
      id: '4',
      location: 'Tech Hub Area',
      address: '321 Innovation Dr, District 3',
      capacity: 100,
      currentLevel: 30,
      status: 'active',
      type: 'general',
      lastCollection: '2024-10-13',
      nextCollection: '2024-10-17',
      coordinates: { lat: 40.7614, lng: -73.9776 }
    },
    {
      id: '5',
      location: 'Hospital Zone',
      address: '555 Health St, District 2',
      capacity: 80,
      currentLevel: 10,
      status: 'maintenance',
      type: 'hazardous',
      lastCollection: '2024-10-10',
      nextCollection: '2024-10-18',
      coordinates: { lat: 40.7489, lng: -73.9680 }
    },
    {
      id: '6',
      location: 'School District',
      address: '888 Education Ave, District 3',
      capacity: 120,
      currentLevel: 60,
      status: 'active',
      type: 'recyclable',
      lastCollection: '2024-10-12',
      nextCollection: '2024-10-15',
      coordinates: { lat: 40.7580, lng: -73.9855 }
    }
  ]);

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

  // Filter bins based on search and filters
  const filteredBins = bins.filter(bin => {
    const matchesSearch = bin.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bin.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bin.status === filterStatus;
    const matchesType = filterType === 'all' || bin.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

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
    const bin: Bin = {
      id: String(bins.length + 1),
      location: newBin.location!,
      address: newBin.address!,
      capacity: newBin.capacity!,
      currentLevel: newBin.currentLevel!,
      status: newBin.status as Bin['status'],
      type: newBin.type as Bin['type'],
      lastCollection: newBin.lastCollection!,
      nextCollection: newBin.nextCollection!
    };
    setBins([...bins, bin]);
    setShowAddModal(false);
    resetNewBin();
  };

  const handleEditBin = () => {
    if (selectedBin) {
      setBins(bins.map(b => b.id === selectedBin.id ? selectedBin : b));
      setShowEditModal(false);
      setSelectedBin(null);
    }
  };

  const handleDeleteBin = (id: string) => {
    if (confirm('Are you sure you want to delete this bin?')) {
      setBins(bins.filter(b => b.id !== id));
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

        {/* Statistics Cards */}
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

        {/* Search and Filters */}
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

        {/* Bins Display - Grid View */}
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
