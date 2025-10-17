import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import {
  AlertCircle, Plus, Search, Filter, MessageSquare, Clock,
  CheckCircle, XCircle, User, Calendar, ChevronRight, X, Send, UserPlus, Edit, Save
} from 'lucide-react';
import { ticketService, type Ticket } from '../services/ticket.service';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

export const TicketsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTicket, setEditedTicket] = useState<{
    title: string;
    description: string;
    category: string;
    priority: string;
  }>({
    title: '',
    description: '',
    category: '',
    priority: ''
  });

  // Fetch team members (collectors, operators, authorities, admins) for assignment
  const { data: usersData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => userService.getAllUsers(),
    enabled: !!(user && (user.role === 'authority' || user.role === 'admin')),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const teamMembers = usersData?.data?.filter((u: any) => 
    ['collector', 'operator', 'authority', 'admin'].includes(u.role)
  ) || [];

  // Fetch tickets with React Query
  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['tickets', { 
      status: filterStatus !== 'all' ? filterStatus : undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      search: searchTerm || undefined
    }],
    queryFn: () => ticketService.getAllTickets({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      search: searchTerm || undefined
    })
  });

  const tickets = ticketsData?.data || [];

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: ticketService.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreateModal(false);
      resetNewTicket();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create ticket');
    }
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketService.updateTicket(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket && response.data) {
        setSelectedTicket(response.data);
      }
      setIsEditMode(false);
      alert('Ticket updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update ticket');
    }
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: ticketService.deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete ticket');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => 
      ticketService.addComment(id, comment),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setCommentText('');
      // Update the selected ticket with the new comment data
      if (selectedTicket && response.data) {
        setSelectedTicket(response.data);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => 
      ticketService.assignTicket(id, userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket && response.data) {
        setSelectedTicket(response.data);
      }
      setSelectedAssignee('');
      alert('Ticket assigned successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to assign ticket');
    }
  });

  // Resolve ticket mutation
  const resolveTicketMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) => 
      ticketService.resolveTicket(id, resolution),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket && response.data) {
        setSelectedTicket(response.data);
      }
      setResolutionText('');
      alert('Ticket resolved successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to resolve ticket');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ticketService.updateStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (selectedTicket && response.data) {
        setSelectedTicket(response.data);
      }
      alert('Ticket status updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  });

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'complaint' as const,
    priority: 'medium' as const
  });

  // Loading and error states
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 rounded-full animate-spin border-emerald-600"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="font-medium text-gray-900">Failed to load tickets</p>
            <p className="mt-2 text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t: Ticket) => t.status === 'open').length,
    inProgress: tickets.filter((t: Ticket) => t.status === 'in-progress').length,
    resolved: tickets.filter((t: Ticket) => t.status === 'resolved').length,
    urgent: tickets.filter((t: Ticket) => t.priority === 'urgent').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'collection': return 'bg-blue-100 text-blue-700';
      case 'bin': return 'bg-orange-100 text-orange-700';
      case 'payment': return 'bg-green-100 text-green-700';
      case 'technical': return 'bg-purple-100 text-purple-700';
      case 'complaint': return 'bg-red-100 text-red-700';
      case 'other': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate(newTicket);
  };

  const handleAddComment = () => {
    if (selectedTicket && commentText.trim()) {
      addCommentMutation.mutate({ 
        id: selectedTicket._id, 
        comment: commentText 
      });
    }
  };

  const handleAssignTicket = () => {
    if (selectedTicket && selectedAssignee) {
      assignTicketMutation.mutate({
        id: selectedTicket._id,
        userId: selectedAssignee
      });
    }
  };

  const handleResolveTicket = () => {
    if (selectedTicket && resolutionText.trim()) {
      resolveTicketMutation.mutate({
        id: selectedTicket._id,
        resolution: resolutionText
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedTicket) {
      updateStatusMutation.mutate({
        id: selectedTicket._id,
        status: newStatus
      });
    }
  };

  const handleEditTicket = () => {
    if (selectedTicket) {
      setEditedTicket({
        title: selectedTicket.title,
        description: selectedTicket.description,
        category: selectedTicket.category,
        priority: selectedTicket.priority
      });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedTicket && editedTicket.title.trim() && editedTicket.description.trim()) {
      updateTicketMutation.mutate({
        id: selectedTicket._id,
        data: editedTicket
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTicket({
      title: '',
      description: '',
      category: '',
      priority: ''
    });
  };

  const resetNewTicket = () => {
    setNewTicket({
      title: '',
      description: '',
      category: 'complaint',
      priority: 'medium'
    });
  };

  const handleDeleteTicket = () => {
    if (selectedTicket) {
      if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
        deleteTicketMutation.mutate(selectedTicket._id, {
          onSuccess: () => {
            setShowDetailsModal(false);
            setSelectedTicket(null);
            setIsEditMode(false);
            alert('Ticket deleted successfully');
          }
        });
      }
    }
  };

  return (
    <Layout>
      <div className="p-6 mx-auto space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <div className="p-2 text-white bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <AlertCircle className="w-7 h-7" />
              </div>
              Support Tickets
            </h1>
            <p className="mt-1 text-gray-600">Report issues and track support requests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Ticket
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.resolved}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search tickets..."
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
            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-200 md:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="missed_pickup">Missed Pickup</option>
                  <option value="damaged_bin">Damaged Bin</option>
                  <option value="complaint">Complaint</option>
                  <option value="request">Request</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.map((ticket: Ticket) => (
            <div
              key={ticket._id}
              className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-xl hover:shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Ticket clicked:', ticket.ticketNumber, 'Status:', ticket.status);
                setSelectedTicket(ticket);
                setShowDetailsModal(true);
              }}
            >
              <div className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${ticket.priority === 'urgent' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-gray-500">{ticket.ticketNumber}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                            {ticket.category}
                          </span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="mb-1 text-lg font-semibold text-gray-900">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-600 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        </div>
                      )}
                      {ticket.comments && ticket.comments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{ticket.comments.length} comment{ticket.comments.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-xl">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No tickets found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Support Ticket</h2>
              <button onClick={() => { setShowCreateModal(false); resetNewTicket(); }} className="p-2 transition-colors rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Detailed description of your issue..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Category *</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="collection">Collection Issue</option>
                    <option value="bin">Bin Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Issue</option>
                    <option value="complaint">Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Priority *</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => { setShowCreateModal(false); resetNewTicket(); }}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.title || !newTicket.description || createTicketMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
                <span className="font-mono text-sm text-gray-500">{selectedTicket.ticketNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit button for residents who own the ticket */}
                {user?.role === 'resident' && 
                 selectedTicket.reporter._id === user._id && 
                 !isEditMode && (
                  <button 
                    onClick={handleEditTicket}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button onClick={() => { setShowDetailsModal(false); setSelectedTicket(null); setIsEditMode(false); }} className="p-2 transition-colors rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getCategoryColor(selectedTicket.category)}`}>
                  {selectedTicket.category.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  Priority: {selectedTicket.priority}
                </span>
                <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>

              {/* Title & Description - Editable for ticket owner */}
              {isEditMode && user?.role === 'resident' && selectedTicket.reporter._id === user._id ? (
                <div className="p-4 space-y-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={editedTicket.title}
                      onChange={(e) => setEditedTicket({ ...editedTicket, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      value={editedTicket.description}
                      onChange={(e) => setEditedTicket({ ...editedTicket, description: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed description of your issue..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Category *</label>
                      <select
                        value={editedTicket.category}
                        onChange={(e) => setEditedTicket({ ...editedTicket, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="collection">Collection Issue</option>
                        <option value="bin">Bin Issue</option>
                        <option value="payment">Payment Issue</option>
                        <option value="technical">Technical Issue</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Priority *</label>
                      <select
                        value={editedTicket.priority}
                        onChange={(e) => setEditedTicket({ ...editedTicket, priority: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editedTicket.title.trim() || !editedTicket.description.trim() || updateTicketMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {updateTicketMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{selectedTicket.title}</h3>
                  <p className="leading-relaxed text-gray-700">{selectedTicket.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Created</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Last Updated</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </p>
                  {selectedTicket.updatedAt !== selectedTicket.createdAt && (
                    <span className="text-xs text-emerald-600">• Modified</span>
                  )}
                </div>
                {selectedTicket.assignedTo && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Assigned To</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {selectedTicket.assignedTo.firstName} {selectedTicket.assignedTo.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Created By</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {selectedTicket.reporter.firstName} {selectedTicket.reporter.lastName}
                  </p>
                </div>
                {selectedTicket.resolvedAt && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Resolved</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(selectedTicket.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Change Status Section - Only for Authority/Admin/Operator */}
              {(user?.role === 'authority' || user?.role === 'admin' || user?.role === 'operator') && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Change Ticket Status
                  </h4>
                  <div className="flex gap-3">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Current status: <span className="font-medium capitalize">{selectedTicket.status.replace('-', ' ')}</span>
                  </p>
                </div>
              )}

              {/* Assignment Section - Only for Authority/Admin */}
              {(user?.role === 'authority' || user?.role === 'admin') && 
               selectedTicket.status !== 'resolved' && 
               selectedTicket.status !== 'closed' && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Assign Ticket to Team Member
                  </h4>
                  <div className="flex gap-3">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select team member...</option>
                      {teamMembers.map((member: any) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName} ({member.role.charAt(0).toUpperCase() + member.role.slice(1)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignTicket}
                      disabled={!selectedAssignee || assignTicketMutation.isPending}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      {assignTicketMutation.isPending ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                  {selectedTicket.assignedTo && (
                    <p className="mt-2 text-sm text-gray-600">
                      Currently assigned to: <span className="font-medium">{selectedTicket.assignedTo.firstName} {selectedTicket.assignedTo.lastName}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Resolve Ticket Section - Only for assigned user or authority */}
              {(user?.role === 'authority' || user?.role === 'admin' || selectedTicket.assignedTo?._id === user?._id) && 
               selectedTicket.status !== 'resolved' && 
               selectedTicket.status !== 'closed' && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Resolve Ticket
                  </h4>
                  <div className="space-y-3">
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      rows={4}
                      placeholder="Describe the resolution and actions taken to fix this issue..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleResolveTicket}
                      disabled={!resolutionText.trim() || resolveTicketMutation.isPending}
                      className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {resolveTicketMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              )}

              {/* Resolution Details - Show if resolved */}
              {selectedTicket.resolution && selectedTicket.resolution.resolution && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Resolution
                  </h4>
                  <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.resolution.resolution}</p>
                    {selectedTicket.resolution.actionTaken && (
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Action Taken:</span> {selectedTicket.resolution.actionTaken}
                      </p>
                    )}
                    {selectedTicket.resolution.resolvedAt && (
                      <p className="pt-3 mt-3 text-xs text-gray-600 border-t border-emerald-200">
                        Resolved on {new Date(selectedTicket.resolution.resolvedAt).toLocaleString()}
                        {selectedTicket.resolution.resolvedBy && (
                          <span> by {selectedTicket.resolution.resolvedBy.firstName} {selectedTicket.resolution.resolvedBy.lastName}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({selectedTicket.comments?.length || 0})
                </h4>
                
                <div className="mb-4 space-y-4">
                  {selectedTicket.comments?.map((comment) => (
                    <div key={comment._id} className="p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.message}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-2 text-white transition-colors rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              {user?.role === 'resident' && selectedTicket.reporter._id === user._id && !isEditMode && (
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleteTicketMutation.isPending}
                  className="flex-1 px-6 py-2.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteTicketMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
                </button>
              )}
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedTicket(null); setIsEditMode(false); }}
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
