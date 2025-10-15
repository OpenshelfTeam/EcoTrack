import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  MessageSquare, Star, ThumbsUp, ThumbsDown, Search, Filter,
  X, Send, Calendar, User, CheckCircle, Clock, Eye, Loader2, AlertCircle, Plus
} from 'lucide-react';
import { feedbackService, type Feedback } from '../services/feedback.service';

export const FeedbackPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    category: 'collection-service',
    subject: '',
    message: '',
    rating: 5
  });

  // Fetch feedback with filters
  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['feedback', filterStatus, filterType, filterRating, searchTerm],
    queryFn: () => feedbackService.getAllFeedback({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      category: filterType !== 'all' ? filterType : undefined,
      rating: filterRating !== 'all' ? parseInt(filterRating) : undefined,
      search: searchTerm || undefined
    })
  });

  // Fetch stats (non-blocking - allow page to load even if stats fail)
  const { data: statsData } = useQuery({
    queryKey: ['feedback-stats'],
    queryFn: feedbackService.getFeedbackStats,
    retry: false,
    staleTime: 60000 // Cache for 1 minute
  });

  // Respond to feedback mutation
  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      feedbackService.respondToFeedback(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      setShowRespondModal(false);
      setResponseText('');
      alert('Response submitted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit response');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      feedbackService.updateFeedbackStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      alert('Status updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  });

  // Create feedback mutation
  const createMutation = useMutation({
    mutationFn: feedbackService.createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      setShowCreateModal(false);
      setNewFeedback({ category: 'collection-service', subject: '', message: '', rating: 5 });
      alert('Feedback submitted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit feedback');
    }
  });

  // Delete feedback mutation
  const deleteMutation = useMutation({
    mutationFn: feedbackService.deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      setShowDetailsModal(false);
      alert('Feedback deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete feedback');
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading feedback...</span>
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
          <span className="text-gray-600">Failed to load feedback</span>
        </div>
      </Layout>
    );
  }

  const feedbacks = feedbackData?.data || [];
  const stats = statsData?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'under-review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'acknowledged': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'addressed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <MessageSquare className="w-4 h-4" />;
      case 'under-review': return <Clock className="w-4 h-4" />;
      case 'acknowledged': return <Send className="w-4 h-4" />;
      case 'addressed': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <X className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (category: string) => {
    switch (category) {
      case 'collection-service': return 'bg-blue-100 text-blue-700';
      case 'bin-quality': return 'bg-green-100 text-green-700';
      case 'collector-behavior': return 'bg-purple-100 text-purple-700';
      case 'payment-system': return 'bg-yellow-100 text-yellow-700';
      case 'app-experience': return 'bg-indigo-100 text-indigo-700';
      case 'suggestion': return 'bg-teal-100 text-teal-700';
      case 'complaint': return 'bg-red-100 text-red-700';
      case 'other': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (category: string) => {
    switch (category) {
      case 'collection-service': return <MessageSquare className="w-4 h-4" />;
      case 'bin-quality': return <MessageSquare className="w-4 h-4" />;
      case 'collector-behavior': return <ThumbsDown className="w-4 h-4" />;
      case 'payment-system': return <ThumbsUp className="w-4 h-4" />;
      case 'app-experience': return <MessageSquare className="w-4 h-4" />;
      case 'suggestion': return <ThumbsUp className="w-4 h-4" />;
      case 'complaint': return <ThumbsDown className="w-4 h-4" />;
      case 'other': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const handleRespond = () => {
    if (selectedFeedback && responseText.trim()) {
      respondMutation.mutate({ id: selectedFeedback._id, response: responseText });
      setShowRespondModal(false);
      setResponseText('');
      setSelectedFeedback(null);
    }
  };

  const handleMarkResolved = (feedback: Feedback) => {
    updateStatusMutation.mutate({ id: feedback._id, status: 'addressed' });
  };

  const handleDeleteFeedback = (id: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteMutation.mutate(id);
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
                <MessageSquare className="w-7 h-7" />
              </div>
              Feedback Management
            </h1>
            <p className="text-gray-600 mt-1">View and respond to customer feedback</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create Feedback
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.new || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.inReview || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.resolved || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.avgRating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.satisfaction || 0}%</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <ThumbsUp className="w-6 h-6 text-emerald-600" />
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
                placeholder="Search feedback..."
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
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under Review</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="addressed">Addressed</option>
                  <option value="closed">Closed</option>
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
                  <option value="collection-service">Collection Service</option>
                  <option value="bin-quality">Bin Quality</option>
                  <option value="collector-behavior">Collector Behavior</option>
                  <option value="payment-system">Payment System</option>
                  <option value="app-experience">App Experience</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="1-2">1-2 Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedbacks.map((feedback: any) => (
            <div
              key={feedback._id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feedback.category === 'compliment' ? 'bg-green-100' : feedback.category === 'complaint' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {getTypeIcon(feedback.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">{feedback._id.slice(-6)}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(feedback.category)}`}>
                            {feedback.category}
                          </span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(feedback.status)}`}>
                            {getStatusIcon(feedback.status)}
                            {feedback.status}
                          </span>
                          {renderStars(feedback.rating)}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{feedback.subject}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{feedback.message}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{feedback.user?.firstName} {feedback.user?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                      {feedback.respondedAt && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Responded on {new Date(feedback.respondedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
                      <>
                        {feedback.status !== 'responded' && (
                          <button
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setShowRespondModal(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Respond
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkResolved(feedback)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {feedbacks.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Feedback Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Feedback Details</h2>
                <span className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedFeedback.status)}`}>
                  {getStatusIcon(selectedFeedback.status)}
                  {selectedFeedback.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedFeedback(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Feedback Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(selectedFeedback.category)}`}>
                    {selectedFeedback.category}
                  </span>
                  <span className="text-sm text-gray-500">ID: {selectedFeedback._id.slice(-6)}</span>
                </div>
                {renderStars(selectedFeedback.rating)}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedFeedback.subject}</h3>
                <p className="text-gray-700 leading-relaxed">{selectedFeedback.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">User</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.user?.firstName} {selectedFeedback.user?.lastName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedFeedback.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.category}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Rating</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.rating} / 5</p>
                </div>
              </div>

              {selectedFeedback.response && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Response
                  </h4>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedFeedback.response}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                      <span>By: {selectedFeedback.respondedBy?.firstName} {selectedFeedback.respondedBy?.lastName}</span>
                      <span>Date: {selectedFeedback.respondedAt ? new Date(selectedFeedback.respondedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedFeedback(null); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showRespondModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Respond to Feedback</h2>
              <button onClick={() => { setShowRespondModal(false); setResponseText(''); setSelectedFeedback(null); }} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{selectedFeedback.subject}</p>
                <p className="text-sm text-gray-600">{selectedFeedback.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response *</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Type your response here..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Tips for responding:</p>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Be professional and courteous</li>
                  <li>Address the customer's concerns directly</li>
                  <li>Provide clear solutions or next steps</li>
                  <li>Thank them for their feedback</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => { setShowRespondModal(false); setResponseText(''); setSelectedFeedback(null); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={!responseText.trim()}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Feedback Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
              <h2 className="text-xl font-bold text-white">Create New Feedback</h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFeedback({ category: 'collection-service', subject: '', message: '', rating: 5 });
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="collection-service">Collection Service</option>
                  <option value="bin-quality">Bin Quality</option>
                  <option value="collector-behavior">Collector Behavior</option>
                  <option value="payment-system">Payment System</option>
                  <option value="app-experience">App Experience</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFeedback.subject}
                  onChange={(e) => setNewFeedback({ ...newFeedback, subject: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Brief description of your feedback"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newFeedback.message}
                  onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  placeholder="Provide detailed feedback..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                      className="focus:outline-none hover:scale-110 transition-transform"
                      type="button"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= newFeedback.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600 self-center">
                    {newFeedback.rating}/5
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your feedback helps us improve our services. 
                  We review all submissions and will respond as soon as possible.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFeedback({ category: 'collection-service', subject: '', message: '', rating: 5 });
                }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newFeedback.subject.trim()) {
                    alert('Please enter a subject');
                    return;
                  }
                  if (!newFeedback.message.trim()) {
                    alert('Please enter a message');
                    return;
                  }
                  createMutation.mutate(newFeedback);
                }}
                disabled={createMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
