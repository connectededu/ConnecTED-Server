import { Request, Response } from 'express';
import User from '../models/User';
import Student from '../models/Student';
import admin from 'firebase-admin';
import mongoose from 'mongoose';

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, q = '', role, isApproved } = req.query;
    
    const query: any = {};
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (currentUser.role === 'parent') {
      // Parents can only query approved teachers
      query.role = 'teacher';
      query.isApproved = true;
    } else if (currentUser.role === 'teacher') {
      // Teachers can only query approved parents
      query.role = 'parent';
      query.isApproved = true;
    } else if (currentUser.role === 'admin') {
      if (role && role !== 'all') query.role = role;
      if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    } else {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      data: users,
      meta: {
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Update user (used for approval and general updates)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the current user state first
    const currentUser = await User.findById(id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Handle Approval Logic specifically
    if (updateData.isApproved === true && currentUser.isApproved === false) {
      console.log(`Approving user: ${currentUser.email}`);
      
      // 1. Ensure Firebase Auth Login exists and set Custom Claims for extra security
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUserByEmail(currentUser.email);
          console.log(`Firebase user already exists for ${currentUser.email} with UID: ${fbUser.uid}`);
          
          if (currentUser.firebaseUid !== fbUser.uid) {
            currentUser.firebaseUid = fbUser.uid;
            await currentUser.save();
          }
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            console.log(`Creating Firebase login for approved user: ${currentUser.email}`);
            fbUser = await admin.auth().createUser({
              uid: currentUser.firebaseUid || undefined,
              email: currentUser.email,
              password: 'Testing@123',
              displayName: currentUser.name
            });
            console.log(`Created Firebase user for ${currentUser.email} with UID: ${fbUser.uid}`);
            
            if (currentUser.firebaseUid !== fbUser.uid) {
              currentUser.firebaseUid = fbUser.uid;
              await currentUser.save();
            }
          } else {
            throw err;
          }
        }

        await admin.auth().setCustomUserClaims(fbUser.uid, { approved: true });
        console.log('Firebase Custom Claims updated: approved=true');
      } catch (fbError) {
        console.error('Failed to update Firebase logins/claims:', fbError);
        // We continue anyway, as the DB is the primary source of truth
      }

      // 2. If parent and student details are changed, update the student record
      if (currentUser.role === 'parent' && updateData.studentDetails) {
        const { admissionNumber, name, dateOfBirth, classId } = updateData.studentDetails;
        const student = await Student.findOne({ parentIds: id });
        if (student) {
          student.name = name || student.name;
          student.dateOfBirth = dateOfBirth || student.dateOfBirth;
          student.classId = classId || student.classId;
          student.admissionNumber = admissionNumber || student.admissionNumber;
          await student.save();
        }
      }
    }

    if (updateData.teacherData && updateData.teacherData.subjects) {
      const programs = await mongoose.model('Program').find();
      const validSubjects = new Set(programs.flatMap((p: any) => p.subjects || []));
      const invalidSubjects = updateData.teacherData.subjects.filter((s: string) => !validSubjects.has(s));
      if (invalidSubjects.length > 0) {
        return res.status(400).json({ error: `Invalid subjects: ${invalidSubjects.join(', ')}` });
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete/Deactivate user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Send email to a user (admin only)
 * POST /api/users/:id/email
 */
export const sendEmailToUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;
    const adminUser = req.user;

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Log the email action (real email sending requires SMTP/SendGrid integration)
    console.log(`[EMAIL] From admin ${adminUser.email} to ${targetUser.email}: ${subject}`);

    // Create audit log for the email
    const { createAuditLog } = await import('../services/audit.service');
    await createAuditLog({
      userId: adminUser._id.toString(),
      action: 'EMAIL_SENT',
      targetType: 'user',
      targetId: id,
      details: `Admin ${adminUser.name} sent email to ${targetUser.name}: "${subject}"`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Email logged successfully. Configure SMTP to send real emails.' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

/**
 * Create a new user (Admin only)
 * POST /api/users
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, isApproved, tempPassword, staffId, subjects, studentIds, newStudents } = req.body;
    const adminUser = req.user;

    if (!adminUser || adminUser.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Check MongoDB first
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // 1. Create/get Firebase Auth User
    let fbUser;
    const password = tempPassword || 'Testing@123';
    try {
      fbUser = await admin.auth().getUserByEmail(email);
      console.log(`Firebase user already exists for ${email} with UID: ${fbUser.uid}`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Creating Firebase login for user: ${email}`);
        fbUser = await admin.auth().createUser({
          email,
          password,
          displayName: name
        });
        console.log(`Created Firebase user for ${email} with UID: ${fbUser.uid}`);
      } else {
        throw err;
      }
    }

    // Set Custom Claims for approved users
    const approved = isApproved !== false; // default true
    await admin.auth().setCustomUserClaims(fbUser.uid, { approved });

    // 2. Initialize User document in MongoDB
    const newUser = new User({
      firebaseUid: fbUser.uid,
      email,
      name,
      role,
      isApproved: approved,
      phone: req.body.phone,
    });

    if (role === 'teacher') {
      newUser.teacherData = {
        staffId: staffId || '',
        subjects: subjects || [],
        yearsOfExperience: req.body.yearsOfExperience || 0,
        classIds: req.body.classIds || [],
      };
    } else if (role === 'parent') {
      const linkedStudentIds: string[] = [];
      if (studentIds && Array.isArray(studentIds)) {
        for (const sId of studentIds) {
          linkedStudentIds.push(sId);
        }
      }

      // Handle newStudents
      if (newStudents && Array.isArray(newStudents)) {
        for (const studentData of newStudents) {
          const { name: sName, dateOfBirth, classId, admissionNumber } = studentData;
          let existingStudent = null;
          if (admissionNumber) {
            existingStudent = await Student.findOne({ admissionNumber });
          }
          if (existingStudent) {
            if (!existingStudent.parentIds.includes(newUser._id.toString())) {
              existingStudent.parentIds.push(newUser._id.toString());
              await existingStudent.save();
            }
            linkedStudentIds.push(existingStudent._id.toString());
          } else {
            const newStudent = new Student({
              id: admissionNumber || `STU-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              name: sName,
              dateOfBirth,
              admissionNumber: admissionNumber || `STU-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              classId: classId || 'awaiting',
              parentIds: [newUser._id.toString()]
            });
            const savedStudent = await newStudent.save();
            linkedStudentIds.push(savedStudent._id.toString());
          }
        }
      }

      newUser.parentData = {
        relationship: req.body.relationship || 'Guardian',
        studentIds: linkedStudentIds,
        emergencyContact: req.body.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
        },
      };
    } else if (role === 'admin') {
      newUser.adminData = {
        department: req.body.department || 'General',
      };
    }

    await newUser.save();

    // Create audit log
    const { createAuditLog } = await import('../services/audit.service');
    await createAuditLog({
      userId: adminUser._id.toString(),
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: newUser._id.toString(),
      details: `Admin created new ${role}: ${name} (${email})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};


