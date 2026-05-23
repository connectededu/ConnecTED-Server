import { Request, Response } from 'express';
import User, { IUser, DEFAULT_PERMISSIONS } from '../models/User';
import Student from '../models/Student';
import { auth } from '../config/firebase';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import mongoose from 'mongoose';

/**
 * Register a new user after Firebase signup
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, name, phone, parentData, teacherData, adminData } = req.body;
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser) {
      res.status(401).json({ error: 'Firebase authentication required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: firebaseUser.uid });
    if (existingUser) {
      res.status(400).json({ error: 'User already registered' });
      return;
    }

    if (role === 'teacher' && teacherData && teacherData.subjects) {
      const programs = await mongoose.model('Program').find();
      const validSubjects = new Set(programs.flatMap((p: any) => p.subjects || []));
      const invalidSubjects = teacherData.subjects.filter((s: string) => !validSubjects.has(s));
      if (invalidSubjects.length > 0) {
        res.status(400).json({ error: `Invalid subjects: ${invalidSubjects.join(', ')}` });
        return;
      }
    }

    // Create new user
    const newUser = new User({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      role,
      name,
      phone,
      isApproved: role === 'admin' ? true : false, // Admins auto-approved
      permissions: DEFAULT_PERMISSIONS[role] || [],
      parentData: role === 'parent' ? parentData : undefined,
      teacherData: role === 'teacher' ? teacherData : undefined,
      adminData: role === 'admin' ? adminData : undefined,
    });

    // Handle Parent Registration with Student creation or linking
    let createdStudentId = null;
    if (role === 'parent' && parentData?.studentDetails) {
      const { name: sName, dateOfBirth, admissionNumber, classId, programId, previousSchool } = parentData.studentDetails;
      
      // First check if a student with this admission number already exists
      let existingStudent = null;
      if (admissionNumber) {
        existingStudent = await Student.findOne({ admissionNumber });
      }

      if (existingStudent) {
        // Link parent to existing student
        if (!existingStudent.parentIds.includes(newUser._id.toString())) {
          existingStudent.parentIds.push(newUser._id.toString());
          await existingStudent.save();
        }
        createdStudentId = existingStudent.id;
        if (newUser.parentData) {
          newUser.parentData.studentIds = [existingStudent._id.toString()];
        }
      } else {
        // Create new student
        const newStudent = new Student({
          id: admissionNumber || `STU-${Date.now()}`,
          name: sName,
          dateOfBirth,
          admissionNumber: admissionNumber || `STU-${Date.now()}`,
          classId: classId || 'awaiting',
          programId,
          parentIds: [newUser._id.toString()],
          previousSchool
        });
        
        const savedStudent = await newStudent.save();
        createdStudentId = savedStudent.id;
        
        // Update parentData to include the student's reference id
        if (newUser.parentData) {
          newUser.parentData.studentIds = [savedStudent._id.toString()];
        }
      }
    }

    await newUser.save();

    // Create audit log
    await createAuditLog({
      userId: newUser._id.toString(),
      action: 'USER_REGISTERED',
      targetType: 'user',
      targetId: newUser._id.toString(),
      details: `New ${role} registered: ${name}${createdStudentId ? `. Student created: ${createdStudentId}` : ''}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Notify admins for approval (if not admin)
    if (role !== 'admin') {
      const admins = await User.find({ role: 'admin', isApproved: true });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id.toString(),
          type: 'approval',
          title: 'New Registration Pending',
          message: `${name} (${role}) has registered and is awaiting approval.`,
          link: '/admin/users',
          data: { newUserId: newUser._id.toString() },
        });
      }
    }

    res.status(201).json({
      message: role === 'admin' 
        ? 'Registration successful' 
        : 'Registration submitted for approval',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isApproved: newUser.isApproved,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Update current user's profile (self-update)
 * PATCH /api/auth/me
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, phone, profilePicture } = req.body;

    // Only allow safe fields — not email or role
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    res.json({
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      profilePicture: user.profilePicture,
      permissions: user.permissions,
      parentData: user.parentData,
      teacherData: user.teacherData,
      adminData: user.adminData,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Approve a user (admin only)
 * POST /api/auth/approve/:userId
 */
export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    if (!adminUser || adminUser.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isApproved) {
      res.status(400).json({ error: 'User already approved' });
      return;
    }

    user.isApproved = true;
    await user.save();

    // Create audit log
    await createAuditLog({
      userId: adminUser._id.toString(),
      action: 'USER_APPROVED',
      targetType: 'user',
      targetId: user._id.toString(),
      details: `Admin ${adminUser.name} approved user ${user.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Notify the user
    await createNotification({
      userId: user._id.toString(),
      type: 'approval',
      title: 'Account Approved',
      message: 'Your account has been approved. You can now access the platform.',
      link: `/${user.role}`,
    });

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

/**
 * Reject/delete a pending user (admin only)
 * DELETE /api/auth/reject/:userId
 */
export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminUser = req.user;

    if (!adminUser || adminUser.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete from Firebase
    try {
      await auth.deleteUser(user.firebaseUid);
    } catch (firebaseError) {
      console.error('Firebase delete error:', firebaseError);
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(userId);

    // Create audit log
    await createAuditLog({
      userId: adminUser._id.toString(),
      action: 'USER_REJECTED',
      targetType: 'user',
      targetId: userId,
      details: `Admin ${adminUser.name} rejected user ${user.name}. Reason: ${reason || 'Not specified'}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'User rejected and deleted' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
};

/**
 * Update FCM token for push notifications
 * POST /api/auth/fcm-token
 */
export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!token) {
      res.status(400).json({ error: 'FCM token required' });
      return;
    }

    // Add token if not already present
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ message: 'FCM token updated' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};

/**
 * Logout - update presence
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (user) {
      user.isOnline = false;
      user.lastActiveAt = new Date();
      await user.save();
    }

    // Clear session cookie securely
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Create secure backend session cookie from Firebase ID token
 * POST /api/auth/session
 */
export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    // Set session expiration (e.g., 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Configure secure cookie options
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('session', sessionCookie, options);
    res.json({ success: true, message: 'Session cookie created successfully' });
  } catch (error) {
    console.error('Session creation failed:', error);
    res.status(401).json({ error: 'Unauthorized session exchange' });
  }
};
