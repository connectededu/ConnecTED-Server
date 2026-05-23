import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Grade from '../models/Grade';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import Student from '../models/Student';
import { getIO } from '../config/socket';

const getGradeQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

const getStudentQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Get grades with filters
 */
export const getGrades = async (req: Request, res: Response) => {
  try {
    const { classId, studentId, subject, term, teacherId } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (subject) query.subject = subject;
    if (term) query.term = term;
    if (teacherId) query.teacherId = teacherId;
    const grades = await Grade.find(query).sort({ publishedAt: -1, createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
};

/**
 * Create a grade entry
 */
export const createGrade = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, subject, term, score, maxScore } = req.body;
    if (!studentId || !classId || !subject || !term || score === undefined || maxScore === undefined) {
      res.status(400).json({ error: 'studentId, classId, subject, term, score and maxScore are required' });
      return;
    }
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const grade = new Grade({
      id: uuidv4(),
      studentId,
      classId,
      subject,
      term,
      score,
      maxScore,
      teacherId: (user as any)._id.toString(),
    });
    await grade.save();
    
    await AuditLog.create({
      id: uuidv4(),
      adminId: (user as any)._id.toString(),
      action: 'CREATE_GRADE',
      targetType: 'grade',
      targetId: grade.id,
      details: `Created grade for student ${studentId}`,
    });

    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grade' });
  }
};

/**
 * Update a grade entry
 */
export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const grade = await Grade.findOneAndUpdate(
      getGradeQuery(id),
      { $set: updates },
      { new: true }
    );
    if (!grade) {
      res.status(404).json({ error: 'Grade not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'UPDATE_GRADE',
        targetType: 'grade',
        targetId: grade.id || grade._id.toString(),
        details: `Updated grade for student ${grade.studentId}`,
      });
    }
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
};

/**
 * Delete a grade entry
 */
export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const grade = await Grade.findOneAndDelete(getGradeQuery(id));
    if (!grade) {
      res.status(404).json({ error: 'Grade not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'DELETE_GRADE',
        targetType: 'grade',
        targetId: id,
        details: `Deleted grade for student ${grade.studentId}`,
      });
    }
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grade' });
  }
};

/**
 * Publish grades (set publishedAt) and notify parents
 */
export const publishGrades = async (req: Request, res: Response) => {
  try {
    const { gradeIds } = req.body; // array of grade _ids or custom ids
    if (!gradeIds || !Array.isArray(gradeIds)) {
      res.status(400).json({ error: 'gradeIds array is required' });
      return;
    }

    const publishedAt = new Date();
    const io = getIO();

    const orConditions: any[] = [];
    gradeIds.forEach((id: string) => {
      if (mongoose.isValidObjectId(id)) {
        orConditions.push({ _id: id });
      }
      orConditions.push({ id });
    });

    await Grade.updateMany(
      { $or: orConditions },
      { $set: { publishedAt } }
    );

    // Notify parents of affected students
    const queryIds = gradeIds.filter(id => mongoose.isValidObjectId(id));
    const grades = await Grade.find({ 
      $or: [
        { _id: { $in: queryIds } },
        { id: { $in: gradeIds } }
      ]
    });
    const studentIds = [...new Set(grades.map(g => g.studentId))];

    for (const studentId of studentIds) {
      const student = await Student.findOne(getStudentQuery(studentId));
      if (student?.parentIds?.length) {
        for (const parentId of student.parentIds) {
          const notif = new Notification({
            id: uuidv4(),
            userId: parentId,
            type: 'grade',
            title: `New grades published for ${student.name}`,
            message: `${student.name}'s grades have been published. Tap to view.`,
            isRead: false,
            link: `/parent/children/${studentId}`,
          });
          await notif.save();
          io?.to(`user:${parentId}`).emit('notification', notif);
        }
      }
    }

    res.json({ message: `${gradeIds.length} grade(s) published successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish grades' });
  }
};
