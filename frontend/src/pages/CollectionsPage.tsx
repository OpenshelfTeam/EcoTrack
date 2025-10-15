import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  Calendar, Package, Plus, ChevronLeft, ChevronRight, Clock,
  MapPin, Users, CheckCircle, AlertCircle, Filter, X, Truck,
  ClipboardList, Download, Eye, Loader2
} from 'lucide-react';
import { collectionService, type CollectionRecord } from '../services/collection.service';

export const CollectionsPage = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [newCollection, setNewCollection] = useState({
    date: '',
    time: '',
    area: '',
    routeName: '',
    wasteType: 'General Waste',
    status: 'scheduled'
  });

  // Fetch collections with filters
  const { data: collectionsData, isLoading, error } = useQuery({
    queryKey: ['collections', filterStatus, filterArea],
    queryFn: () => collectionService.getAllCollections({
      status: filterStatus !== 'all' ? filterStatus : undefined
    })
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['collection-stats'],
    queryFn: () => collectionService.getCollectionStats()
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: collectionService.createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      setShowScheduleModal(false);
      alert('Collection created successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create collection');
    }
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: collectionService.deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      alert('Collection deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete collection');
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading collections...</span>
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
          <span className="text-gray-600">Failed to load collections</span>
        </div>
      </Layout>
    );
  }

  const collections = collectionsData?.data?.records || [];
  const stats = statsData?.data;

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCollectionsForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return collections.filter((c: any) => {
      const collectionDate = new Date(c.collectionDate).toISOString().split('T')[0];
      return collectionDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Filter collections (simplified - filtering done by API)
  const filteredCollections = collections;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'missed': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'missed': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCollections = getCollectionsForDate(day);
      const isToday = 
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-[100px] p-2 border border-gray-200 ${
            isToday ? 'bg-emerald-50 border-emerald-300' : 'bg-white hover:bg-gray-50'
          } transition-colors cursor-pointer`}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-emerald-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayCollections.slice(0, 3).map((collection: any) => (
              <div
                key={collection._id}
                onClick={() => {
                  setSelectedCollection(collection);
                  setShowDetailsModal(true);
                }}
                className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm ${getStatusColor(collection.status)}`}
              >
                <div className="font-medium truncate">{new Date(collection.collectionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="truncate">{collection.location?.area || collection.route?.area || 'N/A'}</div>
              </div>
            ))}
            {dayCollections.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayCollections.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <Calendar className="w-7 h-7" />
              </div>
              Collection Schedule
            </h1>
            <p className="text-gray-600 mt-1">Manage and track waste collection schedules</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              {viewMode === 'calendar' ? <ClipboardList className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Schedule Collection
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
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
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.missed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            {/* Calendar Navigation */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">{formatDate(currentDate)}</h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            {renderCalendar()}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="cancelled">Cancelled</option>
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
            </div>

            {/* Collections List */}
            <div className="space-y-4">
              {filteredCollections.map((collection: any) => (
                <div
                  key={collection._id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${collection.status === 'collected' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-gray-500">{collection._id.slice(-6)}</span>
                              <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(collection.status)}`}>
                                {getStatusIcon(collection.status)}
                                {collection.status.replace('_', ' ')}
                              </span>
                              {collection.wasteWeight && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {collection.wasteWeight} kg
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">{collection.route?.routeName || 'N/A'}</h3>
                            <p className="text-sm text-gray-600">{collection.wasteType}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(collection.collectionDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(collection.collectionDate).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{collection.location?.area || collection.route?.area || 'N/A'}</span>
                          </div>
                          {collection.collector && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <Users className="w-4 h-4" />
                              <span>{collection.collector?.firstName} {collection.collector?.lastName}</span>
                            </div>
                          )}
                          {collection.binLevelBefore && collection.binLevelAfter && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              <span>Bin: {collection.binLevelBefore}% → {collection.binLevelAfter}%</span>
                            </div>
                          )}
                        </div>

                        {collection.status === 'in_progress' && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{Math.round((collection.binsCollected! / collection.totalBins!) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(collection.binsCollected! / collection.totalBins!) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCollection(collection);
                            setShowDetailsModal(true);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        <button
                          onClick={() => alert('Export report functionality')}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Collection Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Schedule Collection</h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newCollection.date}
                    onChange={(e) => setNewCollection({ ...newCollection, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    value={newCollection.time}
                    onChange={(e) => setNewCollection({ ...newCollection, time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                <select
                  value={newCollection.area}
                  onChange={(e) => setNewCollection({ ...newCollection, area: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
                <input
                  type="text"
                  value={newCollection.routeName}
                  onChange={(e) => setNewCollection({ ...newCollection, routeName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter route name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type *</label>
                <select
                  value={newCollection.wasteType}
                  onChange={(e) => setNewCollection({ ...newCollection, wasteType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="General Waste">General Waste</option>
                  <option value="Recyclables">Recyclables</option>
                  <option value="Organic Waste">Organic Waste</option>
                  <option value="Hazardous Waste">Hazardous Waste</option>
                  <option value="Mixed Waste">Mixed Waste</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Note</p>
                <p className="text-xs">Collector and vehicle can be assigned after scheduling</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Collection scheduled successfully!');
                  setShowScheduleModal(false);
                }}
                disabled={!newCollection.date || !newCollection.time || !newCollection.area || !newCollection.routeName}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Schedule Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Details Modal */}
      {showDetailsModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Collection Details</h2>
                <span className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedCollection.status)}`}>
                  {getStatusIcon(selectedCollection.status)}
                  {selectedCollection.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedCollection(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Collection Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection._id.slice(-6)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Route</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection.route?.routeName || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedCollection.collectionDate).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedCollection.collectionDate).toLocaleTimeString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Area</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection.location?.area || selectedCollection.route?.area || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Waste Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection.wasteType}</p>
                </div>
              </div>

              {selectedCollection.collector && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Collector</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection.collector?.firstName} {selectedCollection.collector?.lastName}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Waste Weight</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedCollection.wasteWeight} kg</p>
                  </div>
                </div>
              )}

              {selectedCollection.status === 'collected' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Bin Level</p>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedCollection.binLevelBefore}% → {selectedCollection.binLevelAfter}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedCollection.binLevelAfter}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Reduced from {selectedCollection.binLevelBefore}% to {selectedCollection.binLevelAfter}%
                  </p>
                </div>
              )}

              {selectedCollection.notes && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{selectedCollection.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedCollection(null); }}
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
