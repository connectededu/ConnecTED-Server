import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Homework from '../models/Homework';
import Notification from '../models/Notification';
import Student from '../models/Student';
import { getIO } from '../config/socket';

const getHomeworkQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Get homework with filters
 */
export const getHomework = async (req: Request, res: Response) => {
  try {
    const { classId, teacherId, subject } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (subject) query.subject = subject;
    const homework = await Homework.find(query).sort({ dueDate: 1, createdAt: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
};

/**
 * Get a single homework by ID
 */
export const getHomeworkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hw = await Homework.findOne(getHomeworkQuery(id));
    if (!hw) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }
    res.json(hw);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
};

/**
 * Create a new homework assignment and notify parents
 */
export const createHomework = async (req: Request, res: Response) => {
  try {
    const { classId, title, description, subject, dueDate, attachments } = req.body;
    if (!classId || !title || !description || !subject || !dueDate) {
      res.status(400).json({ error: 'classId, title, description, subject and dueDate are required' });
      return;
    }
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const homework = new Homework({
      id: uuidv4(),
      classId,
      teacherId: (user as any)._id.toString(),
      title,
      description,
      subject,
      dueDate,
      attachments: attachments || [],
    });
    await homework.save();

    // Notify parents of students in this class
    const students = await Student.find({ classId });
    const io = getIO();
    for (const student of students) {
      for (const parentId of (student.parentIds || [])) {
        const notif = new Notification({
          id: uuidv4(),
          userId: parentId,
          type: 'homework',
          title: `New homework: ${title}`,
          message: `${student.name} has new ${subject} homework due ${dueDate}.`,
          isRead: false,
          link: `/parent/children/${student.id}`,
        });
        await notif.save();
        io?.to(`user:${parentId}`).emit('notification', notif);
      }
    }

    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create homework' });
  }
};

/**
 * Update a homework assignment
 */
export const updateHomework = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const hw = await Homework.findOneAndUpdate(
      getHomeworkQuery(id),
      { $set: updates },
      { new: true }
    );
    if (!hw) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }
    res.json(hw);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update homework' });
  }
};

/**
 * Delete a homework assignment
 */
export const deleteHomework = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hw = await Homework.findOneAndDelete(getHomeworkQuery(id));
    if (!hw) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete homework' });
  }
};
