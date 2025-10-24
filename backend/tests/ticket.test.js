import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';
import Ticket from '../models/Ticket.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import SmartBin from '../models/SmartBin.model.js';
import ticketRoutes from '../routes/ticket.routes.js';
import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  addComment,
  resolveTicket,
  getTicketStats,
  deleteTicket
} from '../controllers/ticket.controller.js';

// Setup and teardown
beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});

// Helper function to create mock request and response objects
const mockReqRes = () => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: {}
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
};

// Helper function to create test users
const createTestUser = async (role = 'resident') => {
  return await User.create({
    firstName: 'Test',
    lastName: role === 'resident' ? 'Resident' : role === 'authority' ? 'Authority' : 'User',
    email: `test${role}${Date.now()}@example.com`,
    password: 'password123',
    phone: '1234567890',
    role
  });
};

describe('Ticket Controller Tests', () => {
  
  describe('createTicket - Positive Cases', () => {
    it('should create a new ticket successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      const authority = await createTestUser('authority');
      
      req.user = { _id: resident._id };
      req.body = {
        title: 'Bin not delivered',
        description: 'My bin has not been delivered even after approval',
        category: 'bin',
        priority: 'high'
      };

      await createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            title: 'Bin not delivered',
            status: 'open',
            priority: 'high'
          })
        })
      );

      // Verify ticket was created in database
      const tickets = await Ticket.find();
      expect(tickets).toHaveLength(1);
      expect(tickets[0].ticketNumber).toMatch(/^TKT/);
      
      // Verify notifications were created
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should create ticket with all categories', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const categories = ['collection', 'bin', 'payment', 'technical', 'complaint', 'other'];
      
      for (const category of categories) {
        const { req: newReq, res: newRes } = mockReqRes();
        newReq.user = { _id: resident._id };
        newReq.body = {
          title: `Test ${category} ticket`,
          description: `Testing ${category} category`,
          category,
          priority: 'medium'
        };
        
        await createTicket(newReq, newRes);
        expect(newRes.status).toHaveBeenCalledWith(201);
      }
      
      const tickets = await Ticket.find();
      expect(tickets).toHaveLength(categories.length);
    });

    it('should create ticket with different priorities', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const priorities = ['low', 'medium', 'high', 'urgent'];
      
      for (const priority of priorities) {
        const { req: newReq, res: newRes } = mockReqRes();
        newReq.user = { _id: resident._id };
        newReq.body = {
          title: `Test ${priority} priority ticket`,
          description: `Testing ${priority} priority`,
          category: 'technical',
          priority
        };
        
        await createTicket(newReq, newRes);
        expect(newRes.status).toHaveBeenCalledWith(201);
      }
      
      const tickets = await Ticket.find();
      expect(tickets).toHaveLength(priorities.length);
    });

    it('should auto-generate unique ticket numbers', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const ticketNumbers = new Set();
      
      for (let i = 0; i < 5; i++) {
        const { req: newReq, res: newRes } = mockReqRes();
        newReq.user = { _id: resident._id };
        newReq.body = {
          title: `Test ticket ${i}`,
          description: 'Test description',
          category: 'other',
          priority: 'medium'
        };
        
        await createTicket(newReq, newRes);
        const response = newRes.json.mock.calls[0][0];
        ticketNumbers.add(response.data.ticketNumber);
      }
      
      expect(ticketNumbers.size).toBe(5);
    });
  });

  describe('createTicket - Negative & Edge Cases', () => {
    it('should handle missing required fields', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.body = {
        // Missing title and description
        category: 'bin'
      };

      await createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it('should handle invalid category', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.body = {
        title: 'Test ticket',
        description: 'Test description',
        category: 'invalid-category',
        priority: 'medium'
      };

      await createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle invalid priority', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id };
      req.body = {
        title: 'Test ticket',
        description: 'Test description',
        category: 'technical',
        priority: 'super-urgent' // Invalid
      };

      await createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTickets - Filtering & Pagination', () => {
    it('should get all tickets for admin/authority', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      // Create tickets from different residents
      await Ticket.create({
        title: 'Ticket 1',
        description: 'Test 1',
        category: 'bin',
        reporter: resident1._id
      });
      
      await Ticket.create({
        title: 'Ticket 2',
        description: 'Test 2',
        category: 'payment',
        reporter: resident2._id
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = {};

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(2);
    });

    it('should get only own tickets for resident', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      await Ticket.create({
        title: 'Ticket 1',
        description: 'Test 1',
        category: 'bin',
        reporter: resident1._id
      });
      
      await Ticket.create({
        title: 'Ticket 2',
        description: 'Test 2',
        category: 'payment',
        reporter: resident2._id
      });

      req.user = { _id: resident1._id, role: 'resident' };
      req.query = {};

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
    });

    it('should filter tickets by status', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      await Ticket.create({
        title: 'Open Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'open'
      });
      
      await Ticket.create({
        title: 'Resolved Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'resolved'
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { status: 'open' };

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].status).toBe('open');
    });

    it('should filter tickets by category', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      await Ticket.create({
        title: 'Bin Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });
      
      await Ticket.create({
        title: 'Payment Ticket',
        description: 'Test',
        category: 'payment',
        reporter: resident._id
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { category: 'bin' };

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].category).toBe('bin');
    });

    it('should support pagination', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      // Create 15 tickets
      for (let i = 0; i < 15; i++) {
        await Ticket.create({
          title: `Ticket ${i}`,
          description: 'Test',
          category: 'other',
          reporter: resident._id
        });
      }

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { page: 1, limit: 10 };

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(10);
      expect(response.total).toBe(15);
      expect(response.pages).toBe(2);
    });

    it('should search tickets by title and description', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      await Ticket.create({
        title: 'Damaged bin issue',
        description: 'My bin is damaged',
        category: 'bin',
        reporter: resident._id
      });
      
      await Ticket.create({
        title: 'Payment problem',
        description: 'Payment not processed',
        category: 'payment',
        reporter: resident._id
      });

      req.user = { _id: authority._id, role: 'authority' };
      req.query = { search: 'damaged' };

      await getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].title).toContain('Damaged');
    });
  });

  describe('getTicket - Single Ticket Retrieval', () => {
    it('should get single ticket successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test description',
        category: 'bin',
        reporter: resident._id
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: ticket._id.toString() };

      await getTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            title: 'Test Ticket'
          })
        })
      );
    });

    it('should return 404 for non-existent ticket', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await getTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket not found'
        })
      );
    });

    it('should return 403 when resident views another resident\'s ticket', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident1._id
      });

      req.user = { _id: resident2._id, role: 'resident' };
      req.params = { id: ticket._id.toString() };

      await getTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Not authorized')
        })
      );
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status successfully', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'open'
      });

      req.user = { _id: authority._id };
      req.params = { id: ticket._id.toString() };
      req.body = {
        status: 'in-progress',
        notes: 'Working on it'
      };

      await updateTicketStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = await Ticket.findById(ticket._id);
      expect(updatedTicket.status).toBe('in-progress');
      expect(updatedTicket.statusHistory.length).toBeGreaterThan(0);
    });

    it('should set closedAt when status is closed', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'resolved'
      });

      req.user = { _id: authority._id };
      req.params = { id: ticket._id.toString() };
      req.body = {
        status: 'closed',
        notes: 'Issue resolved'
      };

      await updateTicketStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = await Ticket.findById(ticket._id);
      expect(updatedTicket.status).toBe('closed');
      expect(updatedTicket.closedAt).toBeTruthy();
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to user successfully', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'open'
      });

      req.user = { _id: operator._id };
      req.params = { id: ticket._id.toString() };
      req.body = {
        userId: authority._id.toString(),
        dueDate: new Date('2025-12-01')
      };

      await assignTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = await Ticket.findById(ticket._id);
      expect(updatedTicket.assignedTo.toString()).toBe(authority._id.toString());
      expect(updatedTicket.status).toBe('in-progress');
      
      // Verify notifications were created
      const notifications = await Notification.find();
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 for invalid user', async () => {
      const { req, res } = mockReqRes();
      const operator = await createTestUser('operator');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      req.user = { _id: operator._id };
      req.params = { id: ticket._id.toString() };
      req.body = {
        userId: new mongoose.Types.ObjectId().toString()
      };

      await assignTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found'
        })
      );
    });
  });

  describe('addComment', () => {
    it('should add comment to ticket successfully', async () => {
      const { req, res } = mockReqRes();
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      req.user = { _id: resident._id, role: 'resident' };
      req.params = { id: ticket._id.toString() };
      req.body = {
        message: 'This is a test comment'
      };

      await addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = await Ticket.findById(ticket._id);
      expect(updatedTicket.comments).toHaveLength(1);
      expect(updatedTicket.comments[0].message).toBe('This is a test comment');
    });

    it('should not allow unauthorized users to comment', async () => {
      const { req, res } = mockReqRes();
      const resident1 = await createTestUser('resident');
      const resident2 = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident1._id
      });

      req.user = { _id: resident2._id, role: 'resident' };
      req.params = { id: ticket._id.toString() };
      req.body = {
        message: 'Unauthorized comment'
      };

      await addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('resolveTicket', () => {
    it('should resolve ticket successfully', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'in-progress'
      });

      req.user = { _id: authority._id };
      req.params = { id: ticket._id.toString() };
      req.body = {
        resolution: 'Issue has been fixed',
        actionTaken: 'Replaced damaged bin'
      };

      await resolveTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = await Ticket.findById(ticket._id);
      expect(updatedTicket.status).toBe('resolved');
      expect(updatedTicket.resolution.resolution).toBe('Issue has been fixed');
      expect(updatedTicket.resolution.resolvedAt).toBeTruthy();
      
      // Verify notification was sent to resident
      const notifications = await Notification.find({ recipient: resident._id });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent ticket', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      
      req.user = { _id: authority._id };
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = {
        resolution: 'Test resolution'
      };

      await resolveTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getTicketStats', () => {
    it('should return ticket statistics', async () => {
      const { req, res } = mockReqRes();
      const authority = await createTestUser('authority');
      const resident = await createTestUser('resident');
      
      // Create tickets with different statuses
      await Ticket.create({
        title: 'Open Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id,
        status: 'open'
      });
      
      await Ticket.create({
        title: 'Resolved Ticket',
        description: 'Test',
        category: 'payment',
        reporter: resident._id,
        status: 'resolved',
        resolution: {
          resolvedBy: authority._id,
          resolvedAt: new Date()
        }
      });

      req.user = { _id: authority._id, role: 'authority' };

      await getTicketStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('deleteTicket', () => {
    it('should delete ticket successfully', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params = { id: ticket._id.toString() };

      await deleteTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const deletedTicket = await Ticket.findById(ticket._id);
      expect(deletedTicket).toBeNull();
    });

    it('should return 404 when deleting non-existent ticket', async () => {
      const { req, res } = mockReqRes();
      const admin = await createTestUser('admin');
      
      req.user = { _id: admin._id, role: 'admin' };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await deleteTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Ticket Model Tests', () => {
    it('should auto-generate ticket number', async () => {
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      expect(ticket.ticketNumber).toBeDefined();
      expect(ticket.ticketNumber).toMatch(/^TKT/);
    });

    it('should have default status of open', async () => {
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      expect(ticket.status).toBe('open');
    });

    it('should have default priority of medium', async () => {
      const resident = await createTestUser('resident');
      
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test',
        category: 'bin',
        reporter: resident._id
      });

      expect(ticket.priority).toBe('medium');
    });
  });
});
