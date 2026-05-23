import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: string;
  action: string;
  targetType: 'user' | 'class' | 'student' | 'announcement' | 'event' | 'grade' | 'attendance' | 'message' | 'notification' | 'system' | 'program' | 'subjectGroup' | 'homework';
  targetId: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true },
    action: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['user', 'class', 'student', 'announcement', 'event', 'grade', 'attendance', 'message', 'notification', 'system', 'program', 'subjectGroup', 'homework'],
      required: true,
    },
    targetId: { type: String, required: true },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetType: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
