
import {
  Parent, Teacher, Admin, Student, Class,
  AttendanceRecord, Grade, Homework, Message, MessageThread,
  Announcement, Event, Notification, AuditLog
} from '../types';

// Helper to generate IDs - matching frontend
const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultAvatars = {
  parent: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  teacher: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  admin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  student: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150&h=150&fit=crop',
};

// ... Copying data structures from src/data/mockData.ts but ensuring strict typing ...
// I will blindly copy the content I read from Step 540 but adapt the imports.

export const mockParents: Parent[] = [
  {
    id: 'parent-1',
    email: 'parent@connected.com',
    name: 'Sarah Johnson',
    phone: '+1 555-0101',
    role: 'parent',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    createdAt: '2024-01-15T10:00:00Z',
    isApproved: true,
    relationship: 'Mother',
    studentIds: ['student-1', 'student-2'],
    emergencyContact: {
      name: 'Michael Johnson',
      phone: '+1 555-0102',
      relationship: 'Father'
    },
    // Adding fields expected by User interface
    firebaseUid: 'parent-1-uid' 
  },
  {
    id: 'parent-2',
    email: 'david.williams@email.com',
    name: 'David Williams',
    phone: '+1 555-0103',
    role: 'parent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    createdAt: '2024-01-20T10:00:00Z',
    isApproved: true,
    relationship: 'Father',
    studentIds: ['student-3'],
    emergencyContact: {
      name: 'Emily Williams',
      phone: '+1 555-0104',
      relationship: 'Mother'
    },
    firebaseUid: 'parent-2-uid'
  },
  {
    id: 'parent-3',
    email: 'pending.parent@email.com',
    name: 'Jennifer Martinez',
    phone: '+1 555-0105',
    role: 'parent',
    avatar: defaultAvatars.parent,
    createdAt: '2024-02-01T10:00:00Z',
    isApproved: false,
    relationship: 'Mother',
    studentIds: [],
    emergencyContact: {
      name: 'Carlos Martinez',
      phone: '+1 555-0106',
      relationship: 'Father'
    },
    firebaseUid: 'parent-3-uid'
  }
];

export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    email: 'teacher@connected.com',
    name: 'John Smith',
    phone: '+1 555-0201',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    createdAt: '2023-08-01T10:00:00Z',
    isApproved: true,
    staffId: 'TCH-001',
    subjects: ['Mathematics', 'Science'],
    yearsOfExperience: 8,
    classIds: ['class-1', 'class-2'],
    firebaseUid: 'teacher-1-uid'
  },
  {
    id: 'teacher-2',
    email: 'mary.jones@school.edu',
    name: 'Mary Jones',
    phone: '+1 555-0202',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    createdAt: '2023-08-15T10:00:00Z',
    isApproved: true,
    staffId: 'TCH-002',
    subjects: ['English', 'History'],
    yearsOfExperience: 12,
    classIds: ['class-1', 'class-3'],
    firebaseUid: 'teacher-2-uid'
  },
  {
    id: 'teacher-3',
    email: 'pending.teacher@school.edu',
    name: 'Robert Chen',
    phone: '+1 555-0203',
    role: 'teacher',
    avatar: defaultAvatars.teacher,
    createdAt: '2024-02-01T10:00:00Z',
    isApproved: false,
    staffId: 'TCH-003',
    subjects: ['Art', 'Music'],
    yearsOfExperience: 3,
    classIds: [],
    firebaseUid: 'teacher-3-uid'
  }
];

export const mockAdmins: Admin[] = [
  {
    id: 'admin-1',
    email: 'admin@connected.com',
    name: 'Principal Anderson',
    phone: '+1 555-0301',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    createdAt: '2023-01-01T10:00:00Z',
    isApproved: true,
    department: 'Administration',
    firebaseUid: 'admin-1-uid'
  }
];

export const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Emma Johnson',
    dateOfBirth: '2015-03-15',
    admissionNumber: 'STU-2024-001',
    classId: 'class-1',
    parentIds: ['parent-1'],
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150&h=150&fit=crop'
  },
  {
    id: 'student-2',
    name: 'Liam Johnson',
    dateOfBirth: '2017-07-22',
    admissionNumber: 'STU-2024-002',
    classId: 'class-2',
    parentIds: ['parent-1'],
    avatar: 'https://images.unsplash.com/photo-1595454223600-91d9e3c65679?w=150&h=150&fit=crop'
  },
  {
    id: 'student-3',
    name: 'Sophia Williams',
    dateOfBirth: '2015-11-08',
    admissionNumber: 'STU-2024-003',
    classId: 'class-1',
    parentIds: ['parent-2'],
    avatar: 'https://images.unsplash.com/photo-1595454223600-91d9e3c65679?w=150&h=150&fit=crop'
  },
  {
    id: 'student-4',
    name: 'Noah Brown',
    dateOfBirth: '2016-05-30',
    admissionNumber: 'STU-2024-004',
    classId: 'class-1',
    parentIds: [],
    avatar: defaultAvatars.student
  },
  {
    id: 'student-5',
    name: 'Olivia Davis',
    dateOfBirth: '2016-09-12',
    admissionNumber: 'STU-2024-005',
    classId: 'class-2',
    parentIds: [],
    avatar: defaultAvatars.student
  }
];

export const mockClasses: Class[] = [
  {
    id: 'class-1',
    name: 'Grade 5 Blue',
    grade: '5',
    section: 'Blue',
    teacherIds: ['teacher-1', 'teacher-2'],
    studentIds: ['student-1', 'student-3', 'student-4'],
    subjects: ['Mathematics', 'Science', 'English', 'History']
  },
  {
    id: 'class-2',
    name: 'Grade 3 Green',
    grade: '3',
    section: 'Green',
    teacherIds: ['teacher-1'],
    studentIds: ['student-2', 'student-5'],
    subjects: ['Mathematics', 'Science', 'English']
  },
  {
    id: 'class-3',
    name: 'Grade 4 Red',
    grade: '4',
    section: 'Red',
    teacherIds: ['teacher-2'],
    studentIds: [],
    subjects: ['English', 'History', 'Art']
  }
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'student-1',
    classId: 'class-1',
    date: '2024-02-05',
    status: 'present',
    markedBy: 'teacher-1'
  },
  {
    id: 'att-2',
    studentId: 'student-1',
    classId: 'class-1',
    date: '2024-02-04',
    status: 'present',
    markedBy: 'teacher-1'
  },
  {
    id: 'att-3',
    studentId: 'student-1',
    classId: 'class-1',
    date: '2024-02-03',
    status: 'absent',
    markedBy: 'teacher-1',
    note: 'Sick - flu symptoms'
  },
  {
    id: 'att-4',
    studentId: 'student-3',
    classId: 'class-1',
    date: '2024-02-05',
    status: 'late',
    markedBy: 'teacher-1',
    note: 'Traffic delay'
  },
  {
    id: 'att-5',
    studentId: 'student-2',
    classId: 'class-2',
    date: '2024-02-05',
    status: 'present',
    markedBy: 'teacher-1'
  }
];

export const mockGrades: Grade[] = [
  {
    id: 'grade-1',
    studentId: 'student-1',
    classId: 'class-1',
    subject: 'Mathematics',
    term: 'Term 1',
    score: 92,
    maxScore: 100,
    teacherId: 'teacher-1',
    publishedAt: '2024-01-30T10:00:00Z'
  },
  {
    id: 'grade-2',
    studentId: 'student-1',
    classId: 'class-1',
    subject: 'Science',
    term: 'Term 1',
    score: 88,
    maxScore: 100,
    teacherId: 'teacher-1',
    publishedAt: '2024-01-30T10:00:00Z'
  },
  {
    id: 'grade-3',
    studentId: 'student-1',
    classId: 'class-1',
    subject: 'English',
    term: 'Term 1',
    score: 95,
    maxScore: 100,
    teacherId: 'teacher-2',
    publishedAt: '2024-01-30T10:00:00Z'
  },
  {
    id: 'grade-4',
    studentId: 'student-3',
    classId: 'class-1',
    subject: 'Mathematics',
    term: 'Term 1',
    score: 78,
    maxScore: 100,
    teacherId: 'teacher-1'
  },
  {
    id: 'grade-5',
    studentId: 'student-2',
    classId: 'class-2',
    subject: 'Mathematics',
    term: 'Term 1',
    score: 85,
    maxScore: 100,
    teacherId: 'teacher-1',
    publishedAt: '2024-01-30T10:00:00Z'
  }
];

export const mockHomework: Homework[] = [
  {
    id: 'hw-1',
    classId: 'class-1',
    teacherId: 'teacher-1',
    title: 'Math Problem Set 5',
    description: 'Complete problems 1-20 from Chapter 5. Show all work.',
    subject: 'Mathematics',
    dueDate: '2024-02-10',
    attachments: [],
    createdAt: '2024-02-03T10:00:00Z'
  },
  {
    id: 'hw-2',
    classId: 'class-1',
    teacherId: 'teacher-2',
    title: 'Book Report: Charlotte\'s Web',
    description: 'Write a 500-word book report including summary and personal reflection.',
    subject: 'English',
    dueDate: '2024-02-15',
    attachments: [],
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'hw-3',
    classId: 'class-2',
    teacherId: 'teacher-1',
    title: 'Addition Practice',
    description: 'Complete the addition worksheet.',
    subject: 'Mathematics',
    dueDate: '2024-02-08',
    attachments: [],
    createdAt: '2024-02-04T10:00:00Z'
  }
];

export const mockMessageThreads: MessageThread[] = [
  {
    id: 'thread-1',
    participants: [
      { id: 'parent-1', role: 'parent' },
      { id: 'teacher-1', role: 'teacher' }
    ],
    studentId: 'student-1',
    unreadCount: 1,
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'thread-2',
    participants: [
      { id: 'parent-2', role: 'parent' },
      { id: 'teacher-1', role: 'teacher' }
    ],
    studentId: 'student-3',
    unreadCount: 0,
    createdAt: '2024-02-02T10:00:00Z'
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: 'thread-1',
    senderId: 'parent-1',
    senderRole: 'parent',
    content: 'Hi Mr. Smith, I wanted to ask about Emma\'s progress in Mathematics.',
    timestamp: '2024-02-03T14:30:00Z',
    isRead: true
  },
  {
    id: 'msg-2',
    threadId: 'thread-1',
    senderId: 'teacher-1',
    senderRole: 'teacher',
    content: 'Hello Mrs. Johnson! Emma is doing exceptionally well. She scored 92% on the recent test and actively participates in class.',
    timestamp: '2024-02-03T15:45:00Z',
    isRead: true
  },
  {
    id: 'msg-3',
    threadId: 'thread-1',
    senderId: 'parent-1',
    senderRole: 'parent',
    content: 'That\'s wonderful to hear! Is there anything we can do at home to support her learning?',
    timestamp: '2024-02-03T16:00:00Z',
    isRead: false
  },
  {
    id: 'msg-4',
    threadId: 'thread-2',
    senderId: 'teacher-1',
    senderRole: 'teacher',
    content: 'Mr. Williams, Sophia was late to class today. Please ensure she arrives on time.',
    timestamp: '2024-02-05T09:30:00Z',
    isRead: true
  },
  {
    id: 'msg-5',
    threadId: 'thread-2',
    senderId: 'parent-2',
    senderRole: 'parent',
    content: 'Apologies for the inconvenience. There was heavy traffic this morning. It won\'t happen again.',
    timestamp: '2024-02-05T10:15:00Z',
    isRead: true
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'School Closed for Winter Break',
    content: 'Dear parents and students, please note that the school will be closed from December 23rd to January 3rd for winter break. Classes resume on January 4th. Wishing everyone a wonderful holiday season!',
    authorId: 'admin-1',
    authorRole: 'admin',
    targetAudience: 'all',
    attachments: [],
    publishedAt: '2024-02-01T10:00:00Z',
    image: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&h=400&fit=crop'
  },
  {
    id: 'ann-2',
    title: 'Science Fair 2024',
    content: 'We are excited to announce our annual Science Fair! Students are encouraged to submit their projects by February 20th. The fair will be held on March 1st in the school gymnasium.',
    authorId: 'teacher-1',
    authorRole: 'teacher',
    targetAudience: 'all',
    attachments: [],
    publishedAt: '2024-02-03T10:00:00Z',
    image: 'https://images.unsplash.com/photo-1564596823821-79b97151055e?w=800&h=400&fit=crop'
  },
  {
    id: 'ann-3',
    title: 'Grade 5 Blue - Field Trip Permission',
    content: 'We will be visiting the Natural History Museum on February 15th. Please sign and return the permission slip by February 10th.',
    authorId: 'teacher-1',
    authorRole: 'teacher',
    targetAudience: 'class',
    targetClassIds: ['class-1'],
    attachments: [],
    publishedAt: '2024-02-04T10:00:00Z'
  }
];

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Parent-Teacher Conference',
    description: 'Schedule a one-on-one meeting with your child\'s teachers to discuss academic progress and any concerns.',
    date: '2024-02-20',
    time: '14:00 - 18:00',
    location: 'School Main Building',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=400&fit=crop',
    createdBy: 'admin-1',
    rsvps: [
      { userId: 'parent-1', status: 'attending' }
    ],
    targetAudience: 'parents'
  },
  {
    id: 'event-2',
    title: 'Annual Sports Day',
    description: 'Join us for a fun-filled day of athletic competitions and team activities. All students will participate in various sports events.',
    date: '2024-03-05',
    time: '09:00 - 15:00',
    location: 'School Sports Ground',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
    createdBy: 'admin-1',
    rsvps: [
      { userId: 'parent-1', status: 'attending' },
      { userId: 'parent-2', status: 'attending' }
    ],
    targetAudience: 'all'
  },
  {
    id: 'event-3',
    title: 'Teacher Training Workshop',
    description: 'Professional development workshop on innovative teaching methods and classroom management.',
    date: '2024-02-25',
    time: '10:00 - 16:00',
    location: 'Conference Room A',
    createdBy: 'admin-1',
    rsvps: [
      { userId: 'teacher-1', status: 'attending' },
      { userId: 'teacher-2', status: 'not_attending' }
    ],
    targetAudience: 'teachers'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'parent-1',
    type: 'message',
    title: 'New Message from Mr. Smith',
    message: 'You have a new message regarding Emma\'s progress.',
    isRead: false,
    createdAt: '2024-02-05T15:45:00Z',
    link: '/messages/thread-1'
  },
  {
    id: 'notif-2',
    userId: 'parent-1',
    type: 'grade',
    title: 'New Grades Published',
    message: 'Term 1 grades for Emma have been published.',
    isRead: true,
    createdAt: '2024-01-30T10:00:00Z',
    link: '/my-child/student-1'
  },
  {
    id: 'notif-3',
    userId: 'parent-1',
    type: 'event',
    title: 'Upcoming Event Reminder',
    message: 'Parent-Teacher Conference is in 15 days.',
    isRead: false,
    createdAt: '2024-02-05T09:00:00Z',
    link: '/events/event-1'
  },
  {
    id: 'notif-4',
    userId: 'teacher-1',
    type: 'message',
    title: 'New Message from Mrs. Johnson',
    message: 'Sarah Johnson sent you a message about Emma.',
    isRead: false,
    createdAt: '2024-02-03T16:00:00Z',
    link: '/messages/thread-1'
  },
  {
    id: 'notif-5',
    userId: 'admin-1',
    type: 'approval',
    title: 'New Registration Pending',
    message: 'Jennifer Martinez has registered and is awaiting approval.',
    isRead: false,
    createdAt: '2024-02-01T10:00:00Z',
    link: '/admin/users'
  }
];

export const mockTeacherUpdates: any[] = [];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    action: 'USER_APPROVED',
    targetType: 'user',
    targetId: 'parent-1',
    details: 'Approved parent account for Sarah Johnson',
    timestamp: '2024-01-15T11:00:00Z'
  },
  {
    id: 'log-2',
    adminId: 'admin-1',
    action: 'CLASS_CREATED',
    targetType: 'class',
    targetId: 'class-1',
    details: 'Created Grade 5 Blue class',
    timestamp: '2024-01-10T09:00:00Z'
  },
  {
    id: 'log-3',
    adminId: 'admin-1',
    action: 'TEACHER_ASSIGNED',
    targetType: 'class',
    targetId: 'class-1',
    details: 'Assigned John Smith to Grade 5 Blue',
    timestamp: '2024-01-12T10:00:00Z'
  }
];
