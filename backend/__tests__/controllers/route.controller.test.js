import { jest } from '@jest/globals';

// Mock models
const mockRouteModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn()
};

const mockSmartBinModel = {
  find: jest.fn()
};

const mockUserModel = {
  find: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../../models/Route.model.js', () => ({
  default: mockRouteModel
}));

jest.unstable_mockModule('../../models/SmartBin.model.js', () => ({
  default: mockSmartBinModel
}));

jest.unstable_mockModule('../../models/User.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../models/Notification.model.js', () => ({
  default: mockNotificationModel
}));

// Import functions
const { 
  getRoutes, 
  getRoute, 
  createRoute, 
  updateRoute,
  deleteRoute,
  updateRouteStatus,
  optimizeRoute,
  getRouteStats
} = await import('../../controllers/route.controller.js');

describe('Route Controller Tests', () => {
  let mockReq, mockRes;

  const mockRoute = {
    _id: 'route123',
    routeName: 'Route A',
    routeCode: 'RTA-001',
    area: 'Downtown',
    bins: ['bin1', 'bin2'],
    assignedCollector: 'collector123',
    status: 'pending',
    scheduledDate: new Date('2024-12-25'),
    estimatedDuration: 120,
    distance: 15.5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', _id: 'user123', role: 'operator' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createRoute', () => {
    test('should create route successfully', async () => {
      mockReq.body = {
        routeName: 'Route A',
        area: 'Downtown',
        bins: ['bin1', 'bin2'],
        assignedCollector: 'collector123',
        scheduledDate: '2024-12-25'
      };

      const bins = [
        { _id: 'bin1', location: { coordinates: { latitude: 6.9271, longitude: 79.8612 } } },
        { _id: 'bin2', location: { coordinates: { latitude: 6.9300, longitude: 79.8650 } } }
      ];

      mockSmartBinModel.find.mockResolvedValue(bins);
      mockRouteModel.create.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRoute)
        })
      });

      await createRoute(mockReq, mockRes);

      expect(mockRouteModel.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle validation errors', async () => {
      mockReq.body = { routeName: 'Route A' };

      mockRouteModel.create.mockRejectedValue(new Error('Validation failed'));

      await createRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRoutes', () => {
    test('should get all routes', async () => {
      mockRouteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockRoute])
              })
            })
          })
        })
      });
      mockRouteModel.countDocuments.mockResolvedValue(1);

      await getRoutes(mockReq, mockRes);

      expect(mockRouteModel.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by status', async () => {
      mockReq.query = { status: 'in-progress' };
      mockRouteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockRoute])
              })
            })
          })
        })
      });
      mockRouteModel.countDocuments.mockResolvedValue(1);

      await getRoutes(mockReq, mockRes);

      expect(mockRouteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in-progress' })
      );
    });

    test('should filter by area', async () => {
      mockReq.query = { area: 'Downtown' };
      mockRouteModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockRoute])
              })
            })
          })
        })
      });
      mockRouteModel.countDocuments.mockResolvedValue(1);

      await getRoutes(mockReq, mockRes);

      expect(mockRouteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ area: 'Downtown' })
      );
    });
  });

  describe('getRoute', () => {
    test('should get route by ID', async () => {
      mockReq.params.id = 'route123';
      mockRouteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRoute)
        })
      });

      await getRoute(mockReq, mockRes);

      expect(mockRouteModel.findById).toHaveBeenCalledWith('route123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent route', async () => {
      mockReq.params.id = 'nonexistent';
      mockRouteModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await getRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateRoute', () => {
    test('should update route successfully', async () => {
      mockReq.params.id = 'route123';
      mockReq.body = { routeName: 'Route B' };

      mockRouteModel.findById.mockResolvedValue(mockRoute);
      mockSmartBinModel.find.mockResolvedValue([]);
      mockRouteModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({ ...mockRoute, routeName: 'Route B' })
        })
      });

      await updateRoute(mockReq, mockRes);

      expect(mockRouteModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent route', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { routeName: 'Route B' };

      mockRouteModel.findById.mockResolvedValue(null);

      await updateRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteRoute', () => {
    test('should delete route successfully', async () => {
      mockReq.params.id = 'route123';
      mockRouteModel.findById.mockResolvedValue({ ...mockRoute, status: 'pending' });
      mockRouteModel.findByIdAndDelete.mockResolvedValue(mockRoute);

      await deleteRoute(mockReq, mockRes);

      expect(mockRouteModel.findByIdAndDelete).toHaveBeenCalledWith('route123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent route', async () => {
      mockReq.params.id = 'nonexistent';
      mockRouteModel.findById.mockResolvedValue(null);

      await deleteRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should prevent deletion of in-progress routes', async () => {
      mockReq.params.id = 'route123';
      mockRouteModel.findById.mockResolvedValue({ ...mockRoute, status: 'in-progress' });

      await deleteRoute(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateRouteStatus', () => {
    test('should update status to in-progress', async () => {
      mockReq.params.id = 'route123';
      mockReq.body = { status: 'in-progress' };

      const route = {
        ...mockRoute,
        status: 'pending',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockRouteModel.findById.mockResolvedValue(route);

      await updateRouteStatus(mockReq, mockRes);

      expect(route.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should update status to completed', async () => {
      mockReq.params.id = 'route123';
      mockReq.body = { status: 'completed' };

      const route = {
        ...mockRoute,
        status: 'in-progress',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockRouteModel.findById.mockResolvedValue(route);

      await updateRouteStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('optimizeRoute', () => {
    test('should optimize route bin sequence', async () => {
      mockReq.params.id = 'route123';

      const route = {
        ...mockRoute,
        bins: [
          { _id: 'bin1', location: { coordinates: [79.8612, 6.9271] } },
          { _id: 'bin2', location: { coordinates: [79.8650, 6.9300] } }
        ],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      mockRouteModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(route)
      });

      await optimizeRoute(mockReq, mockRes);

      expect(route.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getRouteStats', () => {
    test('should calculate route statistics', async () => {
      mockReq.user.role = 'admin';

      const mockStats = [
        { _id: 'pending', count: 5 },
        { _id: 'completed', count: 10 }
      ];

      mockRouteModel.aggregate = jest.fn()
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce([{ _id: 'Downtown', count: 8 }]);

      await getRouteStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
