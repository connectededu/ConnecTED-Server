import mongoose, { Document, Schema } from 'mongoose';

// Access level permissions
export type Permission = 
  | 'users:read' | 'users:write' | 'users:delete' | 'users:approve'
  | 'students:read' | 'students:write' | 'students:delete'
  | 'classes:read' | 'classes:write' | 'classes:delete'
  | 'grades:read' | 'grades:write'
  | 'attendance:read' | 'attendance:write'
  | 'homework:read' | 'homework:write'
  | 'messages:read' | 'messages:write'
  | 'announcements:read' | 'announcements:write'
  | 'events:read' | 'events:write' | 'events:rsvp'
  | 'notifications:read' | 'notifications:write'
  | 'audit:read';

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'users:read', 'users:write', 'users:delete', 'users:approve',
    'students:read', 'students:write', 'students:delete',
    'classes:read', 'classes:write', 'classes:delete',
    'grades:read', 'grades:write',
    'attendance:read', 'attendance:write',
    'homework:read', 'homework:write',
    'messages:read', 'messages:write',
    'announcements:read', 'announcements:write',
    'events:read', 'events:write', 'events:rsvp',
    'notifications:read', 'notifications:write',
    'audit:read',
  ],
  teacher: [
    'students:read',
    'classes:read',
    'grades:read', 'grades:write',
    'attendance:read', 'attendance:write',
    'homework:read', 'homework:write',
    'messages:read', 'messages:write',
    'announcements:read', 'announcements:write',
    'events:read', 'events:write', 'events:rsvp',
    'notifications:read',
  ],
  parent: [
    'students:read',
    'classes:read',
    'grades:read',
    'attendance:read',
    'homework:read',
    'messages:read', 'messages:write',
    'announcements:read',
    'events:read', 'events:rsvp',
    'notifications:read',
  ],
};

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'parent';
  isApproved: boolean;
  name: string;
  profilePicture?: string;
  
  // RBAC
  permissions: Permission[];
  
  // Presence & activity
  isOnline: boolean;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  
  // Push notifications
  fcmTokens: string[];
  
  // Role-specific data references
  parentData?: {
    relationship: 'Mother' | 'Father' | 'Guardian';
    studentIds: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  teacherData?: {
    staffId: string;
    subjects: string[];
    yearsOfExperience: number;
    classIds: string[];
  };
  
  adminData?: {
    department: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'parent'],
      required: true,
    },
    isApproved: { type: Boolean, default: false },
    name: { type: String, required: true },
    profilePicture: { type: String },
    
    // RBAC
    permissions: [{ type: String }],
    
    // Presence
    isOnline: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    
    // Push notifications
    fcmTokens: [{ type: String }],
    
    // Role-specific data
    parentData: {
      relationship: { type: String, enum: ['Mother', 'Father', 'Guardian'] },
      studentIds: [{ type: String }],
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
    },
    
    teacherData: {
      staffId: { type: String },
      subjects: [{ type: String }],
      yearsOfExperience: { type: Number },
      classIds: [{ type: String }],
    },
    
    adminData: {
      department: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-assign default permissions based on role
UserSchema.pre('save', function(next) {
  const permissions = this.permissions as string[] | undefined;
  if (this.isNew && (!permissions || permissions.length === 0)) {
    this.permissions = DEFAULT_PERMISSIONS[this.role as string] || [];
  }
  next();
});

// Index for common queries
// Note: email index not needed here as unique: true already creates an index
UserSchema.index({ role: 1, isApproved: 1 });
UserSchema.index({ 'parentData.studentIds': 1 });
UserSchema.index({ 'teacherData.classIds': 1 });

export default mongoose.model<IUser>('User', UserSchema);
