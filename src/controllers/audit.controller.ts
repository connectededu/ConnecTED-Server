import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import User from '../models/User';

/**
 * Get paginated audit logs (Admin only) — enriched with user info
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, action, targetType, startDate, endDate, limit = 50, offset = 0 } = req.query;
    const query: any = {};

    if (userId) query.adminId = userId;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    // Enrich logs with user info for human-readable display
    const adminIds = [...new Set(logs.map(l => l.adminId).filter(Boolean))];
    const users = await User.find({ _id: { $in: adminIds } }).select('name email role').lean();
    const userMap: Record<string, any> = {};
    users.forEach(u => { userMap[(u as any)._id.toString()] = u; });

    const enrichedLogs = logs.map(log => {
      const logObj = log.toObject() as any;
      const admin = userMap[logObj.adminId];
      return {
        ...logObj,
        adminName: admin?.name || 'System',
        adminEmail: admin?.email || '',
        adminRole: admin?.role || 'admin',
      };
    });

    res.json({ logs: enrichedLogs, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
