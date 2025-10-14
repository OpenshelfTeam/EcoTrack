import { useState } from 'react';
import { Layout } from '../components/Layout';
import {
  MessageSquare, Star, ThumbsUp, ThumbsDown, Search, Filter,
  X, Send, Calendar, User, CheckCircle, Clock, Eye
} from 'lucide-react';

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'complaint' | 'suggestion' | 'compliment' | 'general';
  subject: string;
  message: string;
  rating: number;
  status: 'new' | 'in_review' | 'responded' | 'resolved' | 'closed';
  category: 'service_quality' | 'collection_time' | 'bin_condition' | 'staff_behavior' | 'other';
  createdDate: string;
  response?: string;
  responseDate?: string;
  respondedBy?: string;
}

export const FeedbackPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');

  // Mock feedback data
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    {
      id: 'FB001',
      userId: 'USR001',
      userName: 'John Doe',
      type: 'compliment',
      subject: 'Excellent Service',
      message: 'The waste collection service was very prompt and professional. The collector was courteous and efficient.',
      rating: 5,
      status: 'responded',
      category: 'service_quality',
      createdDate: '2024-10-12',
      response: 'Thank you for your positive feedback! We are glad to hear that you had a great experience.',
      responseDate: '2024-10-13',
      respondedBy: 'Support Team'
    },
    {
      id: 'FB002',
      userId: 'USR002',
      userName: 'Jane Smith',
      type: 'complaint',
      subject: 'Missed Collection',
      message: 'My waste was not collected on the scheduled date. This is the second time this month.',
      rating: 2,
      status: 'in_review',
      category: 'collection_time',
      createdDate: '2024-10-13'
    },
    {
      id: 'FB003',
      userId: 'USR003',
      userName: 'Mike Johnson',
      type: 'suggestion',
      subject: 'Add Recycling Bins',
      message: 'It would be great if there were more recycling bins in the community area. Currently, there are not enough.',
      rating: 4,
      status: 'new',
      category: 'other',
      createdDate: '2024-10-14'
    },
    {
      id: 'FB004',
      userId: 'USR004',
      userName: 'Sarah Williams',
      type: 'complaint',
      subject: 'Damaged Bin Not Replaced',
      message: 'I reported a damaged bin two weeks ago but it has not been replaced yet.',
      rating: 2,
      status: 'new',
      category: 'bin_condition',
      createdDate: '2024-10-14'
    },
    {
      id: 'FB005',
      userId: 'USR005',
      userName: 'David Brown',
      type: 'compliment',
      subject: 'Great App Experience',
      message: 'The new app is very user-friendly and makes it easy to request pickups and track collections.',
      rating: 5,
      status: 'resolved',
      category: 'service_quality',
      createdDate: '2024-10-10',
      response: 'We appreciate your feedback! We are constantly working to improve the user experience.',
      responseDate: '2024-10-11',
      respondedBy: 'Product Team'
    },
    {
      id: 'FB006',
      userId: 'USR006',
      userName: 'Lisa Anderson',
      type: 'general',
      subject: 'Question about Hazardous Waste',
      message: 'How do I dispose of hazardous waste like batteries and electronic items?',
      rating: 3,
      status: 'responded',
      category: 'other',
      createdDate: '2024-10-11',
      response: 'For hazardous waste disposal, please schedule a special pickup through the app or contact our support team.',
      responseDate: '2024-10-11',
      respondedBy: 'Support Team'
    }
  ]);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesType = filterType === 'all' || feedback.type === filterType;
    const matchesRating = filterRating === 'all' || 
                         (filterRating === '5' && feedback.rating === 5) ||
                         (filterRating === '4' && feedback.rating === 4) ||
                         (filterRating === '3' && feedback.rating === 3) ||
                         (filterRating === '1-2' && feedback.rating <= 2);
    return matchesSearch && matchesStatus && matchesType && matchesRating;
  });

  // Statistics
  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    inReview: feedbacks.filter(f => f.status === 'in_review').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    avgRating: (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1),
    satisfaction: Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'responded': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <MessageSquare className="w-4 h-4" />;
      case 'in_review': return <Clock className="w-4 h-4" />;
      case 'responded': return <Send className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <X className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint': return 'bg-red-100 text-red-700';
      case 'suggestion': return 'bg-blue-100 text-blue-700';
      case 'compliment': return 'bg-green-100 text-green-700';
      case 'general': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <ThumbsDown className="w-4 h-4" />;
      case 'suggestion': return <MessageSquare className="w-4 h-4" />;
      case 'compliment': return <ThumbsUp className="w-4 h-4" />;
      case 'general': return <MessageSquare className="w-4 h-4" />;
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
      const updatedFeedback = {
        ...selectedFeedback,
        status: 'responded' as const,
        response: responseText,
        responseDate: new Date().toISOString().split('T')[0],
        respondedBy: 'Support Team'
      };
      setFeedbacks(feedbacks.map(f => f.id === selectedFeedback.id ? updatedFeedback : f));
      setShowRespondModal(false);
      setResponseText('');
      setSelectedFeedback(null);
      alert('Response sent successfully!');
    }
  };

  const handleMarkResolved = (feedback: Feedback) => {
    setFeedbacks(feedbacks.map(f => 
      f.id === feedback.id ? { ...f, status: 'resolved' as const } : f
    ));
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
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
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
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
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inReview}</p>
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
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolved}</p>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgRating}</p>
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
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.satisfaction}%</p>
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
                  <option value="new">New</option>
                  <option value="in_review">In Review</option>
                  <option value="responded">Responded</option>
                  <option value="resolved">Resolved</option>
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
                  <option value="complaint">Complaints</option>
                  <option value="suggestion">Suggestions</option>
                  <option value="compliment">Compliments</option>
                  <option value="general">General</option>
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
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${feedback.type === 'compliment' ? 'bg-green-100' : feedback.type === 'complaint' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {getTypeIcon(feedback.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">{feedback.id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(feedback.type)}`}>
                            {feedback.type}
                          </span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(feedback.status)}`}>
                            {getStatusIcon(feedback.status)}
                            {feedback.status.replace('_', ' ')}
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
                        <span>{feedback.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{feedback.createdDate}</span>
                      </div>
                      {feedback.responseDate && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Responded on {feedback.responseDate}</span>
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

        {filteredFeedbacks.length === 0 && (
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
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(selectedFeedback.type)}`}>
                    {selectedFeedback.type}
                  </span>
                  <span className="text-sm text-gray-500">ID: {selectedFeedback.id}</span>
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
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.userName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.createdDate}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedFeedback.category.replace('_', ' ')}</p>
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
                      <span>By: {selectedFeedback.respondedBy}</span>
                      <span>Date: {selectedFeedback.responseDate}</span>
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
    </Layout>
  );
};
