
// User roles
export type UserRole = 'parent' | 'teacher' | 'admin';

// Base user type
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isApproved: boolean;
  firebaseUid?: string; // Optional for now as it's not in frontend types yet
}

export interface Parent extends User {
  role: 'parent';
  relationship: 'Mother' | 'Father' | 'Guardian';
  studentIds: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Teacher extends User {
  role: 'teacher';
  staffId: string;
  subjects: string[];
  yearsOfExperience: number;
  classIds: string[];
}

export interface Admin extends User {
  role: 'admin';
  department: string;
}

// Student (not a user - just data)
export interface Student {
  id: string;
  name: string;
  dateOfBirth: string;
  admissionNumber: string;
  classId: string;
  parentIds: string[];
  avatar?: string;
  previousSchool?: string;
}

// Class
export interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacherIds: string[];
  studentIds: string[];
  subjects: string[];
}

// Attendance
export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  note?: string;
}

// Grades
export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  term: string;
  score: number;
  maxScore: number;
  teacherId: string;
  publishedAt?: string;
}

// Homework
export interface Homework {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  attachments: Attachment[];
  createdAt: string;
}

// Message
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface MessageThread {
  id: string;
  participants: { id: string; role: UserRole }[];
  studentId: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorRole: UserRole;
  targetAudience: 'all' | 'parents' | 'teachers' | 'class';
  targetClassIds?: string[];
  attachments: Attachment[];
  publishedAt: string;
  image?: string;
}

// Event
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  createdBy: string;
  rsvps: { userId: string; status: 'attending' | 'not_attending' }[];
  targetAudience: 'all' | 'parents' | 'teachers' | 'class';
  targetClassIds?: string[];
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'grade' | 'absent' | 'announcement' | 'event' | 'homework' | 'approval';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, any>;
}

// Attachment
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // base64 or blob URL
}

// Update/Note from teacher
export interface TeacherUpdate {
  id: string;
  teacherId: string;
  classId?: string;
  studentId?: string;
  title: string;
  content: string;
  type: 'update' | 'behavior' | 'achievement';
  createdAt: string;
}

// Audit log
export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'class' | 'student' | 'announcement' | 'event';
  targetId: string;
  details: string;
  timestamp: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Form types
export interface ParentSignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  relationship: 'Mother' | 'Father' | 'Guardian';
  studentName: string;
  studentDob: string;
  studentAdmissionNumber?: string;
  studentClass?: string;
  previousSchool?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export interface TeacherSignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  staffId?: string;
  subjects: string[];
  yearsOfExperience?: number;
}

export interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}
