import SmartBin from '../models/SmartBin.model.js';
import CollectionRecord from '../models/CollectionRecord.model.js';
import PickupRequest from '../models/PickupRequest.model.js';
import Ticket from '../models/Ticket.model.js';
import Payment from '../models/Payment.model.js';
import Route from '../models/Route.model.js';
import User from '../models/User.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current period stats
    const [totalBins, activeBins, binsNeedingCollection, totalCollections, todayCollections, currentMonthCollections, lastMonthCollections, totalPickups, pendingPickups, currentMonthPickups, lastMonthPickups, totalTickets, openTickets, currentMonthTickets, lastMonthTickets, totalRevenue, monthlyRevenue, activeRoutes, totalUsers, lastMonthUsers, usersByRole] = await Promise.all([
      SmartBin.countDocuments(),
      SmartBin.countDocuments({ status: 'active' }),
      SmartBin.countDocuments({ fillLevel: { $gte: 80 }, status: 'active' }),
      CollectionRecord.countDocuments(),
      CollectionRecord.countDocuments({ collectionDate: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 59, 999)) } }),
      CollectionRecord.countDocuments({ collectionDate: { $gte: startOfCurrentMonth } }),
      CollectionRecord.countDocuments({ collectionDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      PickupRequest.countDocuments(),
      PickupRequest.countDocuments({ status: 'pending' }),
      PickupRequest.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      PickupRequest.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
      Ticket.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      Ticket.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfCurrentMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Route.countDocuments({ status: 'active' }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $lte: endOfLastMonth } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const binsChange = 0; // Bins don't change frequently, keep at 0 or calculate from creation dates
    const collectionsChange = calculateChange(currentMonthCollections, lastMonthCollections);
    const pickupsChange = calculateChange(currentMonthPickups, lastMonthPickups);
    const ticketsChange = calculateChange(currentMonthTickets, lastMonthTickets);
    const revenueChange = calculateChange(monthlyRevenue[0]?.total || 0, 0); // Would need last month revenue
    const usersChange = calculateChange(totalUsers, lastMonthUsers);

    // Parse user role counts
    const roleBreakdown = {
      admins: 0,
      collectors: 0,
      residents: 0,
      operators: 0,
      authorities: 0
    };

    usersByRole.forEach(role => {
      if (role._id === 'admin') roleBreakdown.admins = role.count;
      else if (role._id === 'collector') roleBreakdown.collectors = role.count;
      else if (role._id === 'resident') roleBreakdown.residents = role.count;
      else if (role._id === 'operator') roleBreakdown.operators = role.count;
      else if (role._id === 'authority') roleBreakdown.authorities = role.count;
    });

    res.json({ 
      success: true, 
      data: { 
        bins: { total: totalBins, active: activeBins, needingCollection: binsNeedingCollection, change: binsChange }, 
        collections: { total: totalCollections, today: todayCollections, change: collectionsChange }, 
        pickups: { total: totalPickups, pending: pendingPickups, change: pickupsChange }, 
        tickets: { total: totalTickets, open: openTickets, change: ticketsChange }, 
        revenue: { total: totalRevenue[0]?.total || 0, monthly: monthlyRevenue[0]?.total || 0, change: revenueChange }, 
        routes: { active: activeRoutes }, 
        users: { 
          total: totalUsers, 
          change: usersChange,
          ...roleBreakdown
        } 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard statistics', error: error.message });
  }
};

export const getWasteStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.collectionDate = {};
      if (startDate) matchStage.collectionDate.$gte = new Date(startDate);
      if (endDate) matchStage.collectionDate.$lte = new Date(endDate);
    }
    const groupByFormat = groupBy === 'month' ? { year: { $year: '$collectionDate' }, month: { $month: '$collectionDate' } } : { year: { $year: '$collectionDate' }, month: { $month: '$collectionDate' }, day: { $dayOfMonth: '$collectionDate' } };
    const wasteByType = await CollectionRecord.aggregate([{ $match: matchStage }, { $group: { _id: '$wasteType', count: { $sum: 1 }, totalWeight: { $sum: '$wasteWeight' } } }]);
    const wasteTrends = await CollectionRecord.aggregate([{ $match: matchStage }, { $group: { _id: groupByFormat, count: { $sum: 1 }, totalWeight: { $sum: '$wasteWeight' } } }, { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }]);
    res.json({ success: true, data: { byType: wasteByType, trends: wasteTrends } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching waste statistics', error: error.message });
  }
};

export const getEfficiencyMetrics = async (req, res) => {
  try {
    const routeEfficiency = await Route.aggregate([{ $match: { status: { $in: ['active', 'completed'] } } }, { $group: { _id: null, avgDuration: { $avg: '$duration' }, avgDistance: { $avg: '$distance' }, completionRate: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 100, { $multiply: [{ $divide: ['$progress', '$bins'] }, 100] }] } } } }]);
    const collectorPerformance = await CollectionRecord.aggregate([{ $match: { collectionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }, { $group: { _id: '$collector', collectionsCompleted: { $sum: 1 }, totalWeight: { $sum: '$wasteWeight' }, avgWeight: { $avg: '$wasteWeight' } } }, { $sort: { collectionsCompleted: -1 } }, { $limit: 10 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'collectorInfo' } }, { $unwind: { path: '$collectorInfo', preserveNullAndEmptyArrays: true } }]);
    const binUtilization = await SmartBin.aggregate([{ $group: { _id: '$wasteType', avgFillLevel: { $avg: '$fillLevel' }, count: { $sum: 1 } } }]);
    res.json({ success: true, data: { routeEfficiency: routeEfficiency[0] || {}, collectorPerformance, binUtilization } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching efficiency metrics', error: error.message });
  }
};

export const getFinancialAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthlyRevenue = await Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${parseInt(year) + 1}-01-01`) } } }, { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { '_id.month': 1 } }]);
    const paymentStatus = await Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }]);
    const revenueByType = await Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$paymentMethod', revenue: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    res.json({ success: true, data: { monthlyRevenue, paymentStatus, revenueByType } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching financial analytics', error: error.message });
  }
};

export const getAreaStatistics = async (req, res) => {
  try {
    const routesByArea = await Route.aggregate([{ $group: { _id: '$area', routeCount: { $sum: 1 }, totalBins: { $sum: { $size: '$bins' } } } }, { $sort: { routeCount: -1 } }]);
    const binsByLocation = await SmartBin.aggregate([{ $group: { _id: '$location.address', binCount: { $sum: 1 }, avgFillLevel: { $avg: '$fillLevel' } } }, { $sort: { binCount: -1 } }, { $limit: 20 }]);
    res.json({ success: true, data: { routesByArea, binsByLocation } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching area statistics', error: error.message });
  }
};

export const getEngagementStatistics = async (req, res) => {
  try {
    const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const pickupRequestStats = await PickupRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const ticketStats = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { usersByRole, activeUsers, pickupRequestStats, ticketStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching engagement statistics', error: error.message });
  }
};

export const exportAnalytics = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let data;
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }
    switch (type) {
      case 'collections':
        data = await CollectionRecord.find(dateFilter.$gte || dateFilter.$lte ? { collectionDate: dateFilter } : {}).populate('bin collector resident route');
        break;
      case 'pickups':
        data = await PickupRequest.find(dateFilter.$gte || dateFilter.$lte ? { requestDate: dateFilter } : {}).populate('resident collector');
        break;
      case 'payments':
        data = await Payment.find(dateFilter.$gte || dateFilter.$lte ? { createdAt: dateFilter } : {}).populate('user');
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error exporting analytics data', error: error.message });
  }
};
