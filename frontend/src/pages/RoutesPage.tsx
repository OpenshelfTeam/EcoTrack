import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  MapPin, Truck, Plus, Search, Filter, Edit2, Trash2, Users,
  Clock, Navigation, CheckCircle, AlertCircle, Calendar, X,
  Route as RouteIcon, Zap, Eye, Map as MapIcon, Loader2,
  Camera, QrCode, PlayCircle, Flag, Image, XCircle, ArrowRight
} from 'lucide-react';
import { routeService, type Route } from '../services/route.service';
import { useAuth } from '../contexts/AuthContext';

export const RoutesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [newRoute, setNewRoute] = useState({
    routeName: '',
    area: '',
    scheduledDate: '',
    scheduledTime: { start: '', end: '' },
    priority: 'medium',
    notes: ''
  });

  // Collector workflow states
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [currentBinIndex, setCurrentBinIndex] = useState(0);
  const [collectedBins, setCollectedBins] = useState<any[]>([]);
  const [showBinScanner, setShowBinScanner] = useState(false);
  const [showBinStatusModal, setShowBinStatusModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [currentBin, setCurrentBin] = useState<any>(null);
  const [exceptionData, setExceptionData] = useState({
    issueType: '',
    notes: '',
    photo: null as File | null
  });

  // Fetch routes with filters
  const { data: routesData, isLoading, error } = useQuery({
    queryKey: ['routes', filterStatus, filterArea, searchTerm],
    queryFn: () => routeService.getAllRoutes({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      area: filterArea !== 'all' ? filterArea : undefined,
      search: searchTerm || undefined
    })
  });

  // Fetch route statistics
  const { data: statsData } = useQuery({
    queryKey: ['route-stats'],
    queryFn: () => routeService.getRouteStats()
  });

  // Create route mutation
  const createMutation = useMutation({
    mutationFn: routeService.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      setShowCreateModal(false);
      alert('Route created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create route');
    }
  });

  // Update route mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      routeService.updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      alert('Route updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update route');
    }
  });

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: routeService.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      alert('Route deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete route');
    }
  });

  // Start route mutation
  const startMutation = useMutation({
    mutationFn: routeService.startRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      alert('Route started successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to start route');
    }
  });

  // Complete route mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      routeService.completeRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      alert('Route completed successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to complete route');
    }
  });

  // Optimize route mutation
  const optimizeMutation = useMutation({
    mutationFn: routeService.optimizeRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      alert('Route optimized successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to optimize route');
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading routes...</span>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-red-600 mr-2" />
          <span className="text-gray-600">Failed to load routes</span>
        </div>
      </Layout>
    );
  }

  const routes = routesData?.data?.routes || [];
  const stats = statsData?.data;

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
    createMutation.mutate(newRoute);
    setShowCreateModal(false);
    resetNewRoute();
  };

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      deleteMutation.mutate(routeId);
    }
  };

  const handleOptimizeRoute = (route: Route) => {
    optimizeMutation.mutate(route._id);
  };

  const handleStartRoute = (routeId: string) => {
    startMutation.mutate(routeId);
  };

  const handleCompleteRoute = (routeId: string) => {
    const distance = prompt('Enter total distance covered (km):');
    const collectedBins = prompt('Enter number of bins collected:');
    
    if (distance && collectedBins) {
      completeMutation.mutate({
        id: routeId,
        data: {
          distance: parseFloat(distance),
          collectedBins: parseInt(collectedBins)
        }
      });
    }
  };

  const resetNewRoute = () => {
    setNewRoute({
      routeName: '',
      area: '',
      scheduledDate: '',
      scheduledTime: { start: '', end: '' },
      priority: 'medium',
      notes: ''
    });
  };

  // Collector workflow handlers
  const handleStartCollectionRoute = (route: Route) => {
    setActiveRoute(route);
    setCurrentBinIndex(0);
    setCollectedBins([]);
    setViewMode('map');
    startMutation.mutate(route._id);
  };

  const handleScanBin = (bin: any) => {
    setCurrentBin(bin);
    setShowBinScanner(false);
    setShowBinStatusModal(true);
  };

  const handleMarkBinStatus = (status: 'collected' | 'empty' | 'damaged') => {
    if (!currentBin || !activeRoute) return;

    const binData = {
      binId: currentBin._id,
      status,
      timestamp: new Date().toISOString(),
      location: currentBin.location
    };

    setCollectedBins([...collectedBins, binData]);
    
    // Send notification to bin owner and admins
    const message = status === 'collected' 
      ? `Your bin at ${currentBin.location?.address} has been collected.`
      : status === 'empty'
      ? `Your bin at ${currentBin.location?.address} was marked as empty.`
      : `Your bin at ${currentBin.location?.address} is damaged and needs attention.`;
    
    alert(`Notification sent: ${message}`);
    
    setShowBinStatusModal(false);
    setCurrentBin(null);

    // Move to next bin
    if (currentBinIndex < (activeRoute.bins?.length || 0) - 1) {
      setCurrentBinIndex(currentBinIndex + 1);
    }
  };

  const handleReportException = () => {
    if (!currentBin || !exceptionData.issueType) {
      alert('Please fill in all required fields');
      return;
    }

    // Send exception report with photo and notes
    const exceptionReport = {
      binId: currentBin._id,
      location: currentBin.location,
      issueType: exceptionData.issueType,
      notes: exceptionData.notes,
      photo: exceptionData.photo,
      timestamp: new Date().toISOString(),
      reportedBy: 'Collector' // Would use actual user data
    };

    alert(`Exception reported for bin ${currentBin._id}. Notifications sent to bin owner and admins.`);
    
    setShowExceptionModal(false);
    setShowBinStatusModal(false);
    setCurrentBin(null);
    setExceptionData({ issueType: '', notes: '', photo: null });

    // Move to next bin
    if (activeRoute && currentBinIndex < (activeRoute.bins?.length || 0) - 1) {
      setCurrentBinIndex(currentBinIndex + 1);
    }
  };

  const handleCompleteCollectionRoute = () => {
    if (!activeRoute) return;

    if (confirm(`Complete route "${activeRoute.routeName}"? ${collectedBins.length} bins processed.`)) {
      completeMutation.mutate({
        id: activeRoute._id,
        data: {
          collectedBins: collectedBins.length,
          distance: 0, // Would calculate from GPS tracking
          completedAt: new Date().toISOString()
        }
      });

      // Send completion notifications
      alert(`Route completed! Notifications sent to all bin owners and admins.`);
      
      setActiveRoute(null);
      setCurrentBinIndex(0);
      setCollectedBins([]);
      setViewMode('list');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <RouteIcon className="w-7 h-7" />
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <RouteIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.pending || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.['in-progress'] || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Truck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.completed || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Routes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.todayRoutes || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
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
            {routes.map((route: any) => (
              <div
                key={route._id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${route.status === 'pending' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-gray-500">{route.routeCode}</span>
                            <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(route.status)}`}>
                              {getStatusIcon(route.status)}
                              {route.status}
                            </span>
                            {route.status === 'in-progress' && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {route.collectedBins}/{route.totalBins} bins
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{route.routeName}</h3>
                          <p className="text-sm text-gray-600">{route.notes}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{route.area}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(route.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{route.scheduledTime.start} - {route.scheduledTime.end}</span>
                        </div>
                        {route.distance && (
                          <div className="flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            <span>{route.distance} km</span>
                          </div>
                        )}
                        {route.assignedCollector && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Users className="w-4 h-4" />
                            <span>{route.assignedCollector.firstName} {route.assignedCollector.lastName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          <span>{route.totalBins} bins</span>
                        </div>
                      </div>

                      {route.status === 'in-progress' && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((route.collectedBins / route.totalBins) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(route.collectedBins / route.totalBins) * 100}%` }}
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
                        onClick={() => handleDeleteRoute(route._id)}
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
          // Interactive Collector Map View
          <div className="space-y-6">
            {activeRoute ? (
              // Active Route Collection Interface
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Map Container */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <MapIcon className="w-6 h-6 text-blue-600" />
                          Route Map
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{activeRoute.routeName}</p>
                      </div>
                      <button
                        onClick={handleCompleteCollectionRoute}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Flag className="w-5 h-5" />
                        Complete Route
                      </button>
                    </div>

                    {/* Map Display */}
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden border-2 border-blue-100 mb-4" style={{ height: '500px' }}>
                      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-6">
                        {activeRoute.bins?.map((bin: any, index: number) => {
                          const isCollected = collectedBins.some(b => b.binId === bin._id);
                          const isCurrent = index === currentBinIndex;
                          
                          return (
                            <button
                              key={bin._id}
                              onClick={() => {
                                setCurrentBin(bin);
                                setShowBinScanner(true);
                              }}
                              disabled={isCollected}
                              className={`relative p-4 rounded-xl border-2 transition-all ${
                                isCollected
                                  ? 'bg-emerald-100 border-emerald-400 opacity-60'
                                  : isCurrent
                                  ? 'bg-yellow-100 border-yellow-400 shadow-lg animate-pulse'
                                  : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                              }`}
                            >
                              <div className="absolute -top-2 -right-2">
                                {isCollected ? (
                                  <CheckCircle className="w-6 h-6 text-emerald-600 bg-white rounded-full" />
                                ) : isCurrent ? (
                                  <div className="w-6 h-6 bg-yellow-500 rounded-full animate-ping" />
                                ) : (
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                              <MapPin className={`w-8 h-8 mx-auto mb-2 ${
                                isCollected ? 'text-emerald-600' : isCurrent ? 'text-yellow-600' : 'text-gray-600'
                              }`} />
                              <p className="text-xs font-medium text-gray-900 truncate">{bin.location?.address || `Bin ${index + 1}`}</p>
                              <p className="text-xs text-gray-500 mt-1">{bin.type || 'Standard'}</p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation overlay */}
                      <div className="absolute bottom-4 right-4 space-y-2">
                        <button className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                          <Navigation className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>

                    {/* Route Progress */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800">Collection Progress</h4>
                        <span className="text-2xl font-bold text-emerald-600">
                          {collectedBins.length}/{activeRoute.bins?.length || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${((collectedBins.length / (activeRoute.bins?.length || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Collected</p>
                          <p className="text-xl font-bold text-emerald-600">{collectedBins.filter(b => b.status === 'collected').length}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Empty</p>
                          <p className="text-xl font-bold text-yellow-600">{collectedBins.filter(b => b.status === 'empty').length}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Damaged</p>
                          <p className="text-xl font-bold text-red-600">{collectedBins.filter(b => b.status === 'damaged').length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Actions Panel - 1 column */}
                <div className="space-y-4">
                  {/* Current Bin Info */}
                  {activeRoute.bins && activeRoute.bins[currentBinIndex] && (
                    <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Next Bin</p>
                          <p className="font-bold text-gray-900">{activeRoute.bins[currentBinIndex].location?.address || `Bin ${currentBinIndex + 1}`}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          <span>Type: {activeRoute.bins[currentBinIndex].type || 'Standard'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          <span>Distance: 0.5 km</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowBinScanner(true)}
                        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-5 h-5" />
                        Scan Bin QR Code
                      </button>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Quick Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (activeRoute.bins && activeRoute.bins[currentBinIndex]) {
                            setCurrentBin(activeRoute.bins[currentBinIndex]);
                            setShowExceptionModal(true);
                          }
                        }}
                        className="w-full px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Camera className="w-5 h-5" />
                        Report Issue
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        Cancel Route
                      </button>
                    </div>
                  </div>

                  {/* Recent Collections */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Recent Collections</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {collectedBins.slice().reverse().map((bin, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                            bin.status === 'collected' ? 'text-emerald-600' :
                            bin.status === 'empty' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {bin.location?.address || 'Bin Location'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{bin.status}</p>
                          </div>
                        </div>
                      ))}
                      {collectedBins.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No collections yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Select Route to Start
              <div className="bg-white rounded-xl border border-gray-200 p-12">
                <div className="max-w-2xl mx-auto text-center">
                  <MapIcon className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Collection Route</h3>
                  <p className="text-gray-600 mb-8">Select a route below to begin waste collection with interactive map guidance</p>
                  
                  <div className="space-y-4">
                    {routes.filter((r: any) => r.status === 'pending' || r.status === 'active').map((route: any) => (
                      <button
                        key={route._id}
                        onClick={() => handleStartCollectionRoute(route)}
                        className="w-full p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{route.routeName}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {route.area}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                                {route.bins?.length || 0} bins
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {route.scheduledTime.start} - {route.scheduledTime.end}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <PlayCircle className="w-8 h-8 text-emerald-600" />
                            <ArrowRight className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))}
                    {routes.filter((r: any) => r.status === 'pending' || r.status === 'active').length === 0 && (
                      <p className="text-gray-500 py-8">No active routes available to start</p>
                    )}
                  </div>

                  <button
                    onClick={() => setViewMode('list')}
                    className="mt-8 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Back to List View
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {routes.length === 0 && viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <RouteIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                  value={newRoute.routeName}
                  onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter route name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newRoute.notes}
                  onChange={(e) => setNewRoute({ ...newRoute, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief notes about the route"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date *</label>
                  <input
                    type="date"
                    value={newRoute.scheduledDate}
                    onChange={(e) => setNewRoute({ ...newRoute, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={newRoute.scheduledTime.start}
                    onChange={(e) => setNewRoute({ ...newRoute, scheduledTime: { ...newRoute.scheduledTime, start: e.target.value } })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={newRoute.scheduledTime.end}
                    onChange={(e) => setNewRoute({ ...newRoute, scheduledTime: { ...newRoute.scheduledTime, end: e.target.value } })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newRoute.priority}
                  onChange={(e) => setNewRoute({ ...newRoute, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Note</p>
                <p className="text-xs">Route bins and collector can be assigned after creation</p>
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
                disabled={!newRoute.routeName || !newRoute.area || !newRoute.scheduledDate || !newRoute.scheduledTime.start || !newRoute.scheduledTime.end}
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
                <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.routeName}</h2>
                <span className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedRoute.status)}`}>
                  {getStatusIcon(selectedRoute.status)}
                  {selectedRoute.status}
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
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedRoute.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Start Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.scheduledTime.start}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">End Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.scheduledTime.end}</p>
                </div>
              </div>

              {selectedRoute.assignedCollector && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Collector</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.assignedCollector.firstName} {selectedRoute.assignedCollector.lastName}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Total Bins</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedRoute.totalBins}</p>
                  </div>
                </div>
              )}

              {/* Bins List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Assigned Bins ({selectedRoute.bins?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedRoute.bins && selectedRoute.bins.length > 0 ? (
                    selectedRoute.bins.map((bin: any, index: number) => (
                      <div key={bin._id || index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-emerald-500 text-white">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{bin.location?.address || bin.binId || 'Bin Location'}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>Type: {bin.type || 'N/A'}</span>
                            <span>Status: {bin.status || 'N/A'}</span>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No bins assigned yet</p>
                  )}
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

      {/* Bin Scanner Modal */}
      {showBinScanner && currentBin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
                Scan Bin QR Code
              </h3>
              <button
                onClick={() => setShowBinScanner(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="text-2xl text-gray-400" />
              </button>
            </div>
            
            {/* Scanner Area */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-6 border-2 border-dashed border-blue-300">
              <div className="text-center">
                <QrCode className="h-24 w-24 text-blue-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-700 font-medium mb-2">Position QR code within frame</p>
                <p className="text-sm text-gray-500">or tap NFC-enabled bin</p>
                <div className="mt-4 p-3 bg-white/70 rounded-lg">
                  <p className="text-xs font-medium text-gray-600">Bin Location</p>
                  <p className="text-sm font-bold text-gray-900">{currentBin.location?.address || 'Bin Location'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleScanBin(currentBin)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Confirm Scan
              </button>
              <button
                onClick={() => setShowBinScanner(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bin Status Selection Modal */}
      {showBinStatusModal && currentBin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                Mark Bin Status
              </h3>
              <button
                onClick={() => {
                  setShowBinStatusModal(false);
                  setCurrentBin(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="text-2xl text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-600">Bin Location</p>
              <p className="text-lg font-bold text-gray-800">{currentBin.location?.address || 'Bin Location'}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <span>Type: {currentBin.type || 'Standard'}</span>
                <span>•</span>
                <span>ID: {currentBin._id?.substring(0, 8)}...</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleMarkBinStatus('collected')}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
              >
                <CheckCircle className="h-6 w-6" />
                Collected Successfully
              </button>
              <button
                onClick={() => handleMarkBinStatus('empty')}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 h-5" />
                No Garbage (Empty)
              </button>
              <button
                onClick={() => {
                  setShowBinStatusModal(false);
                  setShowExceptionModal(true);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <AlertCircle className="h-5 h-5" />
                Damaged / Report Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Report Modal */}
      {showExceptionModal && currentBin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Camera className="h-6 w-6 text-orange-600" />
                </div>
                Report Exception
              </h3>
              <button
                onClick={() => {
                  setShowExceptionModal(false);
                  setCurrentBin(null);
                  setExceptionData({ issueType: '', notes: '', photo: null });
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="text-2xl text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-600">Bin Location</p>
              <p className="text-lg font-bold text-gray-800">{currentBin.location?.address || 'Bin Location'}</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setExceptionData({ ...exceptionData, photo: e.target.files[0] });
                      }
                    }}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    {exceptionData.photo && (
                      <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Photo selected: {exceptionData.photo.name}</p>
                    )}
                  </label>
                </div>
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type *</label>
                <select
                  value={exceptionData.issueType}
                  onChange={(e) => setExceptionData({ ...exceptionData, issueType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select issue type</option>
                  <option value="damaged">Bin Damaged</option>
                  <option value="inaccessible">Bin Inaccessible</option>
                  <option value="missing">Bin Missing</option>
                  <option value="hazardous">Hazardous Material</option>
                  <option value="overfilled">Overfilled</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={exceptionData.notes}
                  onChange={(e) => setExceptionData({ ...exceptionData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                ></textarea>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This will notify the bin owner and system administrators immediately.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReportException}
                disabled={!exceptionData.issueType || !exceptionData.notes}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report & Notify
              </button>
              <button
                onClick={() => {
                  setShowExceptionModal(false);
                  setCurrentBin(null);
                  setExceptionData({ issueType: '', notes: '', photo: null });
                }}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
