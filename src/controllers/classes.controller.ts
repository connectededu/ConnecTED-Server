import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Class from '../models/Class';
import Student from '../models/Student';
import User from '../models/User';

const getClassQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Search classes for dropdown
 */
export const searchClasses = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const query = q ? { name: { $regex: q, $options: 'i' } } : {};
    const classes = await Class.find(query).limit(5).select('id name grade section');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search classes' });
  }
};

/**
 * Get all classes
 */
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find().sort({ grade: 1, name: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

/**
 * Get a single class by ID
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cls = await Class.findOne(getClassQuery(id));
    if (!cls) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
};

/**
 * Create a new class
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, grade, section, teacherIds, studentIds, subjects } = req.body;
    if (!name || !grade || !section) {
      res.status(400).json({ error: 'Name, grade, and section are required' });
      return;
    }
    const cls = new Class({
      id: uuidv4(),
      name,
      grade,
      section,
      teacherIds: teacherIds || [],
      studentIds: studentIds || [],
      subjects: subjects || [],
    });
    await cls.save();
    res.status(201).json(cls);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'A class with that name/section already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create class' });
  }
};

/**
 * Update a class
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const cls = await Class.findOneAndUpdate(
      getClassQuery(id),
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!cls) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update class' });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cls = await Class.findOneAndDelete(getClassQuery(id));
    if (!cls) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

/**
 * Get students and teachers in a class
 */
export const getClassMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cls = await Class.findOne(getClassQuery(id));
    if (!cls) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    const [students, teachers] = await Promise.all([
      Student.find({ $or: [{ classId: id }, { classId: (cls as any)._id?.toString() }] }),
      User.find({ 'teacherData.classIds': { $in: [id] }, role: 'teacher' }).select('-firebaseUid -permissions -fcmTokens'),
    ]);
    res.json({ class: cls, students, teachers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class members' });
  }
};
