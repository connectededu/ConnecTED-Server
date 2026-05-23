import AuditLog from '../models/AuditLog';
import { getIO } from '../config/socket';

export interface AuditLogData {
  userId: string;
  action: string;
  targetType: 'user' | 'class' | 'student' | 'announcement' | 'event' | 'grade' | 'attendance' | 'message' | 'notification' | 'system' | 'program' | 'subjectGroup' | 'homework';
  targetId: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    const auditLog = new AuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      adminId: data.userId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
    });

    await auditLog.save();

    // Emit real-time update to admins
    const io = getIO();
    if (io) {
      io.to('admins').emit('audit:new', {
        id: auditLog.id,
        action: auditLog.action,
        details: auditLog.details,
        timestamp: auditLog.timestamp,
      });
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (options: {
  userId?: string;
  action?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  const query: Record<string, any> = {};

  if (options.userId) query.adminId = options.userId;
  if (options.action) query.action = options.action;
  if (options.targetType) query.targetType = options.targetType;
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);

  const total = await AuditLog.countDocuments(query);

  return { logs, total };
};

/**
 * Common audit actions
 */
export const AuditActions = {
  // User actions
  USER_REGISTERED: 'USER_REGISTERED',
  USER_APPROVED: 'USER_APPROVED',
  USER_REJECTED: 'USER_REJECTED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  
  // Grade actions
  GRADE_CREATED: 'GRADE_CREATED',
  GRADE_UPDATED: 'GRADE_UPDATED',
  GRADE_PUBLISHED: 'GRADE_PUBLISHED',
  
  // Attendance actions
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  
  // Announcement actions
  ANNOUNCEMENT_CREATED: 'ANNOUNCEMENT_CREATED',
  ANNOUNCEMENT_UPDATED: 'ANNOUNCEMENT_UPDATED',
  ANNOUNCEMENT_DELETED: 'ANNOUNCEMENT_DELETED',
  
  // Event actions
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
  
  // Message actions
  MESSAGE_SENT: 'MESSAGE_SENT',
  
  // Class actions
  CLASS_CREATED: 'CLASS_CREATED',
  CLASS_UPDATED: 'CLASS_UPDATED',
  CLASS_DELETED: 'CLASS_DELETED',
  
  // Student actions
  STUDENT_ENROLLED: 'STUDENT_ENROLLED',
  STUDENT_UPDATED: 'STUDENT_UPDATED',
  STUDENT_REMOVED: 'STUDENT_REMOVED',
};
