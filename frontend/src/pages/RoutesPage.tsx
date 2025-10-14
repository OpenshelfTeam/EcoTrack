import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  MapPin, Truck, Plus, Search, Filter, Edit2, Trash2, Users,
  Clock, Navigation, CheckCircle, AlertCircle, Calendar, X,
  Route, Zap, Eye, Map as MapIcon
} from 'lucide-react';

interface RouteStop {
  id: string;
  address: string;
  binId: string;
  binType: string;
  estimatedTime: string;
  completed: boolean;
  notes?: string;
}

interface CollectionRoute {
  id: string;
  name: string;
  description?: string;
  area: string;
  status: 'active' | 'inactive' | 'completed' | 'in_progress';
  assignedCollector?: string;
  vehicleNumber?: string;
  scheduleDay: string;
  startTime: string;
  estimatedDuration: string;
  stops: RouteStop[];
  distance?: string;
  completedStops?: number;
  totalStops?: number;
}

export const RoutesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<CollectionRoute | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Mock routes data
  const [routes, setRoutes] = useState<CollectionRoute[]>([
    {
      id: 'RT001',
      name: 'Downtown Route A',
      description: 'Main street and surrounding residential areas',
      area: 'Downtown',
      status: 'active',
      assignedCollector: 'John Smith',
      vehicleNumber: 'WM-101',
      scheduleDay: 'Monday, Wednesday, Friday',
      startTime: '06:00 AM',
      estimatedDuration: '4 hours',
      distance: '15.5 km',
      totalStops: 25,
      completedStops: 0,
      stops: [
        { id: 'S001', address: '123 Main St', binId: 'BIN001', binType: 'general', estimatedTime: '06:15 AM', completed: false },
        { id: 'S002', address: '456 Oak Ave', binId: 'BIN002', binType: 'recyclable', estimatedTime: '06:30 AM', completed: false },
        { id: 'S003', address: '789 Pine Rd', binId: 'BIN003', binType: 'organic', estimatedTime: '06:45 AM', completed: false }
      ]
    },
    {
      id: 'RT002',
      name: 'Suburban Route B',
      description: 'Residential suburbs and housing complexes',
      area: 'Suburbs',
      status: 'in_progress',
      assignedCollector: 'Mike Johnson',
      vehicleNumber: 'WM-102',
      scheduleDay: 'Tuesday, Thursday',
      startTime: '07:00 AM',
      estimatedDuration: '5 hours',
      distance: '22.3 km',
      totalStops: 35,
      completedStops: 12,
      stops: [
        { id: 'S004', address: '321 Elm St', binId: 'BIN004', binType: 'general', estimatedTime: '07:15 AM', completed: true },
        { id: 'S005', address: '654 Birch Ln', binId: 'BIN005', binType: 'recyclable', estimatedTime: '07:30 AM', completed: true },
        { id: 'S006', address: '987 Cedar Dr', binId: 'BIN006', binType: 'organic', estimatedTime: '07:45 AM', completed: false }
      ]
    },
    {
      id: 'RT003',
      name: 'Industrial Zone Route',
      description: 'Commercial and industrial area coverage',
      area: 'Industrial',
      status: 'active',
      assignedCollector: 'Sarah Williams',
      vehicleNumber: 'WM-103',
      scheduleDay: 'Monday, Wednesday',
      startTime: '05:00 AM',
      estimatedDuration: '6 hours',
      distance: '28.7 km',
      totalStops: 18,
      completedStops: 0,
      stops: [
        { id: 'S007', address: '111 Factory Rd', binId: 'BIN007', binType: 'general', estimatedTime: '05:15 AM', completed: false },
        { id: 'S008', address: '222 Commerce St', binId: 'BIN008', binType: 'recyclable', estimatedTime: '05:45 AM', completed: false }
      ]
    },
    {
      id: 'RT004',
      name: 'East Side Community',
      description: 'East side residential neighborhoods',
      area: 'East Side',
      status: 'completed',
      assignedCollector: 'David Brown',
      vehicleNumber: 'WM-104',
      scheduleDay: 'Friday',
      startTime: '06:30 AM',
      estimatedDuration: '3 hours',
      distance: '12.1 km',
      totalStops: 20,
      completedStops: 20,
      stops: [
        { id: 'S009', address: '555 East Ave', binId: 'BIN009', binType: 'general', estimatedTime: '06:45 AM', completed: true },
        { id: 'S010', address: '666 Park Pl', binId: 'BIN010', binType: 'recyclable', estimatedTime: '07:00 AM', completed: true }
      ]
    },
    {
      id: 'RT005',
      name: 'West End Route',
      description: 'West side mixed residential and commercial',
      area: 'West End',
      status: 'inactive',
      scheduleDay: 'Saturday',
      startTime: '08:00 AM',
      estimatedDuration: '4 hours',
      distance: '16.8 km',
      totalStops: 22,
      completedStops: 0,
      stops: [
        { id: 'S011', address: '777 West Blvd', binId: 'BIN011', binType: 'general', estimatedTime: '08:15 AM', completed: false }
      ]
    }
  ]);

  const [newRoute, setNewRoute] = useState<Partial<CollectionRoute>>({
    name: '',
    description: '',
    area: '',
    scheduleDay: '',
    startTime: '',
    estimatedDuration: '',
    status: 'active',
    stops: []
  });

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    const matchesArea = filterArea === 'all' || route.area === filterArea;
    return matchesSearch && matchesStatus && matchesArea;
  });

  // Statistics
  const stats = {
    total: routes.length,
    active: routes.filter(r => r.status === 'active').length,
    inProgress: routes.filter(r => r.status === 'in_progress').length,
    completed: routes.filter(r => r.status === 'completed').length,
    totalDistance: routes.reduce((sum, r) => sum + (parseFloat(r.distance || '0')), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateRoute = () => {
    const route: CollectionRoute = {
      id: `RT${String(routes.length + 1).padStart(3, '0')}`,
      name: newRoute.name!,
      description: newRoute.description,
      area: newRoute.area!,
      status: 'active',
      scheduleDay: newRoute.scheduleDay!,
      startTime: newRoute.startTime!,
      estimatedDuration: newRoute.estimatedDuration!,
      stops: [],
      totalStops: 0,
      completedStops: 0
    };
    setRoutes([...routes, route]);
    setShowCreateModal(false);
    resetNewRoute();
  };

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      setRoutes(routes.filter(r => r.id !== routeId));
    }
  };

  const handleOptimizeRoute = (route: CollectionRoute) => {
    alert(`Optimizing route ${route.name}... Route optimized successfully!`);
  };

  const resetNewRoute = () => {
    setNewRoute({
      name: '',
      description: '',
      area: '',
      scheduleDay: '',
      startTime: '',
      estimatedDuration: '',
      status: 'active',
      stops: []
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
                <Route className="w-7 h-7" />
              </div>
              Collection Routes
            </h1>
            <p className="text-gray-600 mt-1">Plan and manage waste collection routes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              {viewMode === 'list' ? <MapIcon className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              {viewMode === 'list' ? 'Map View' : 'List View'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create Route
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Route className="w-6 h-6 text-gray-600" />
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
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDistance.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">kilometers</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search routes..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Areas</option>
                  <option value="Downtown">Downtown</option>
                  <option value="Suburbs">Suburbs</option>
                  <option value="Industrial">Industrial</option>
                  <option value="East Side">East Side</option>
                  <option value="West End">West End</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Routes List */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${route.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-gray-500">{route.id}</span>
                            <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(route.status)}`}>
                              {getStatusIcon(route.status)}
                              {route.status.replace('_', ' ')}
                            </span>
                            {route.status === 'in_progress' && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {route.completedStops}/{route.totalStops} stops
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{route.name}</h3>
                          <p className="text-sm text-gray-600">{route.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{route.area}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{route.scheduleDay}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{route.startTime} ({route.estimatedDuration})</span>
                        </div>
                        {route.distance && (
                          <div className="flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            <span>{route.distance}</span>
                          </div>
                        )}
                        {route.assignedCollector && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Users className="w-4 h-4" />
                            <span>{route.assignedCollector}</span>
                          </div>
                        )}
                        {route.vehicleNumber && (
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            <span>{route.vehicleNumber}</span>
                          </div>
                        )}
                      </div>

                      {route.status === 'in_progress' && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((route.completedStops! / route.totalStops!) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(route.completedStops! / route.totalStops!) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                      <button
                        onClick={() => handleOptimizeRoute(route)}
                        className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Optimize
                      </button>
                      <button
                        onClick={() => alert('Edit route functionality would be implemented here')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MapIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View</h3>
            <p className="text-gray-600">Interactive route map visualization would be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">Integrate with Google Maps API or similar service</p>
          </div>
        )}

        {filteredRoutes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create New Route</h2>
              <button onClick={() => { setShowCreateModal(false); resetNewRoute(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Name *</label>
                <input
                  type="text"
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter route name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRoute.description}
                  onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of the route"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                  <select
                    value={newRoute.area}
                    onChange={(e) => setNewRoute({ ...newRoute, area: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Area</option>
                    <option value="Downtown">Downtown</option>
                    <option value="Suburbs">Suburbs</option>
                    <option value="Industrial">Industrial</option>
                    <option value="East Side">East Side</option>
                    <option value="West End">West End</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Day *</label>
                  <input
                    type="text"
                    value={newRoute.scheduleDay}
                    onChange={(e) => setNewRoute({ ...newRoute, scheduleDay: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Monday, Wednesday"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={newRoute.startTime}
                    onChange={(e) => setNewRoute({ ...newRoute, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration *</label>
                  <input
                    type="text"
                    value={newRoute.estimatedDuration}
                    onChange={(e) => setNewRoute({ ...newRoute, estimatedDuration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., 4 hours"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Note</p>
                <p className="text-xs">Route stops can be added after creating the route</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setShowCreateModal(false); resetNewRoute(); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={!newRoute.name || !newRoute.area || !newRoute.scheduleDay || !newRoute.startTime || !newRoute.estimatedDuration}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.name}</h2>
                <span className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedRoute.status)}`}>
                  {getStatusIcon(selectedRoute.status)}
                  {selectedRoute.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedRoute(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Route Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Area</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.area}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Schedule</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.scheduleDay}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Start Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.startTime}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.estimatedDuration}</p>
                </div>
              </div>

              {selectedRoute.assignedCollector && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Collector</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.assignedCollector}</p>
                  </div>
                  {selectedRoute.vehicleNumber && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 uppercase">Vehicle</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.vehicleNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stops List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Route Stops ({selectedRoute.stops.length})
                </h3>
                <div className="space-y-3">
                  {selectedRoute.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          stop.completed ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{stop.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>Bin: {stop.binId}</span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded">{stop.binType}</span>
                          <span>{stop.estimatedTime}</span>
                        </div>
                      </div>
                      {stop.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedRoute(null); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
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
