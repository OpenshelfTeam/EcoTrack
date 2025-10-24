import { jest } from '@jest/globals';

// Mock models
const mockTicketModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  findById: jest.fn(),
  find: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Ticket.model.js', () => ({
  default: mockTicketModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  addComment,
  deleteTicket,
  getTicketStats
} = await import('../../controllers/ticket.controller.js');

describe('Ticket Controller Tests', () => {
  let mockReq, mockRes;

  const mockTicket = {
    _id: 'ticket123',
    title: 'Bin not collected',
    description: 'My bin was not collected on scheduled date',
    category: 'collection',
    priority: 'high',
    status: 'open',
    createdBy: 'user123',
    comments: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', id: 'user123', role: 'resident' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createTicket', () => {
    test('should create ticket successfully', async () => {
      mockReq.body = {
        title: 'Bin not collected',
        description: 'My bin was not collected',
        category: 'collection',
        priority: 'high'
      };

      mockTicketModel.create.mockResolvedValue(mockTicket);
      mockNotificationModel.create.mockResolvedValue({});

      await createTicket(mockReq, mockRes);

      expect(mockTicketModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should return error for missing required fields', async () => {
      mockReq.body = {
        title: 'Test',
        // missing description
        category: 'collection'
      };

      await createTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return error for invalid category', async () => {
      mockReq.body = {
        title: 'Test',
        description: 'Test description',
        category: 'invalid-category'
      };

      await createTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getTickets', () => {
    test('should get all tickets', async () => {
      mockTicketModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTicket])
              })
            })
          })
        })
      });
      mockTicketModel.countDocuments.mockResolvedValue(1);

      await getTickets(mockReq, mockRes);

      expect(mockTicketModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.query.status = 'open';
      mockTicketModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTicket])
              })
            })
          })
        })
      });
      mockTicketModel.countDocuments.mockResolvedValue(1);

      await getTickets(mockReq, mockRes);

      expect(mockTicketModel.find).toHaveBeenCalledWith({ status: 'open' });
    });

    test('should filter by category', async () => {
      mockReq.query.category = 'collection';
      mockTicketModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTicket])
              })
            })
          })
        })
      });
      mockTicketModel.countDocuments.mockResolvedValue(1);

      await getTickets(mockReq, mockRes);

      expect(mockTicketModel.find).toHaveBeenCalledWith({ category: 'collection' });
    });
  });

  describe('getTicket', () => {
    test('should get ticket by ID', async () => {
      mockReq.params.id = 'ticket123';
      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockTicket)
          })
        })
      });

      await getTicket(mockReq, mockRes);

      expect(mockTicketModel.findById).toHaveBeenCalledWith('ticket123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent ticket', async () => {
      mockReq.params.id = 'nonexistent';
      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await getTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateTicket', () => {
    test('should update ticket successfully', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { title: 'Updated Title' };

      const ticket = {
        ...mockTicket,
        save: jest.fn().mockResolvedValue(true)
      };

      mockTicketModel.findById.mockResolvedValue(ticket);

      await updateTicket(mockReq, mockRes);

      expect(ticket.title).toBe('Updated Title');
      expect(ticket.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent ticket', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { title: 'Updated' };
      mockTicketModel.findById.mockResolvedValue(null);

      await updateTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateTicketStatus', () => {
    test('should update ticket status', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { status: 'in-progress' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user123' },
        save: jest.fn().mockResolvedValue(true)
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });
      mockNotificationModel.create.mockResolvedValue({});

      await updateTicketStatus(mockReq, mockRes);

      expect(ticket.status).toBe('in-progress');
      expect(ticket.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return error for invalid status', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { status: 'invalid-status' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user123' }
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });

      await updateTicketStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('assignTicket', () => {
    test('should assign ticket to agent', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { assignedTo: 'agent123' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user123' },
        save: jest.fn().mockResolvedValue(true)
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });
      mockUserModel.findById.mockResolvedValue({ _id: 'agent123', role: 'operator' });
      mockNotificationModel.create.mockResolvedValue({});

      await assignTicket(mockReq, mockRes);

      expect(ticket.assignedTo).toBe('agent123');
      expect(ticket.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent agent', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { assignedTo: 'nonexistent' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user123' }
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });
      mockUserModel.findById.mockResolvedValue(null);

      await assignTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addComment', () => {
    test('should add comment to ticket', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { text: 'This is a comment' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user456' },
        comments: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });
      mockNotificationModel.create.mockResolvedValue({});

      await addComment(mockReq, mockRes);

      expect(ticket.comments.length).toBe(1);
      expect(ticket.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return error for empty comment', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.body = { text: '' };

      const ticket = {
        ...mockTicket,
        createdBy: { _id: 'user123' }
      };

      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(ticket)
      });

      await addComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteTicket', () => {
    test('should delete ticket successfully', async () => {
      mockReq.params.id = 'ticket123';
      mockReq.user.role = 'admin';
      mockTicketModel.findById.mockResolvedValue(mockTicket);
      mockTicketModel.findByIdAndDelete.mockResolvedValue(mockTicket);

      await deleteTicket(mockReq, mockRes);

      expect(mockTicketModel.findByIdAndDelete).toHaveBeenCalledWith('ticket123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent ticket', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.user.role = 'admin';
      mockTicketModel.findById.mockResolvedValue(null);

      await deleteTicket(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getTicketStats', () => {
    test('should get ticket statistics', async () => {
      const stats = [
        { _id: 'open', count: 20 },
        { _id: 'in-progress', count: 15 },
        { _id: 'resolved', count: 50 }
      ];
      mockTicketModel.aggregate.mockResolvedValue(stats);
      mockTicketModel.countDocuments.mockResolvedValue(85);

      await getTicketStats(mockReq, mockRes);

      expect(mockTicketModel.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
