import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Student from '../models/Student';
import Class from '../models/Class';
import User from '../models/User';
import Grade from '../models/Grade';
import Attendance from '../models/Attendance';

const getStudentQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

const getClassQuery = (id: string) => {
  return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id };
};

/**
 * Check if admission number exists
 */
export const checkAdmissionNumber = async (req: Request, res: Response) => {
  try {
    const { admissionNumber } = req.params;
    const student = await Student.findOne({ admissionNumber });
    res.json({ exists: !!student, student: student || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check admission number' });
  }
};

/**
 * Auto-generate admission number
 */
export const generateAdmissionNumber = async (req: Request, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const admissionNumber = `STU-${year}-${(count + 1).toString().padStart(4, '0')}`;
    res.json({ admissionNumber });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate admission number' });
  }
};

/**
 * Get all students with optional filters
 */
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const { classId, parentId } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (parentId) query.parentIds = parentId;
    const students = await Student.find(query).sort({ name: 1 });
    
    // Compute attendance and avgGrade for each student
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      const studentObj: Record<string, any> = student.toObject();
      
      const attendanceRecords = await Attendance.find({ studentId: student.id });
      const totalAtt = attendanceRecords.length;
      const presCount = attendanceRecords.filter(a => a.status === 'present').length;
      studentObj.attendanceRate = totalAtt > 0 ? Math.round((presCount / totalAtt) * 100) : null;
      
      const gradeRecords = await Grade.find({ studentId: student.id });
      studentObj.avgGrade = gradeRecords.length > 0
        ? Math.round(gradeRecords.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / gradeRecords.length)
        : null;
        
      return studentObj;
    }));
    
    res.json(enrichedStudents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne(getStudentQuery(id));
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    // Enrich with class and parent info
    const [cls, parents] = await Promise.all([
      Class.findOne(getClassQuery(student.classId)),
      User.find({ _id: { $in: student.parentIds } }).select('name email phone profilePicture'),
    ]);
    res.json({ ...student.toObject(), class: cls, parents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

/**
 * Create a new student
 */
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, dateOfBirth, admissionNumber, classId, programId, parentIds, avatar, previousSchool } = req.body;
    if (!name || !dateOfBirth || !classId) {
      res.status(400).json({ error: 'Name, date of birth, and classId are required' });
      return;
    }

    // Auto-generate admission number if not provided
    let finalAdmissionNumber = admissionNumber;
    if (!finalAdmissionNumber) {
      const year = new Date().getFullYear();
      const count = await Student.countDocuments();
      finalAdmissionNumber = `STU-${year}-${(count + 1).toString().padStart(4, '0')}`;
    } else {
      // Check uniqueness
      const existing = await Student.findOne({ admissionNumber: finalAdmissionNumber });
      if (existing) {
        res.status(409).json({ error: 'Admission number already in use' });
        return;
      }
    }

    const student = new Student({
      id: uuidv4(),
      name,
      dateOfBirth,
      admissionNumber: finalAdmissionNumber,
      classId,
      programId,
      parentIds: parentIds || [],
      avatar,
      previousSchool,
    });
    await student.save();

    // Add student to the class's studentIds list
    await Class.findOneAndUpdate(
      getClassQuery(classId),
      { $addToSet: { studentIds: student.id } }
    );

    res.status(201).json(student);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Admission number already in use' });
      return;
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
};

/**
 * Update a student
 */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const oldStudent = await Student.findOne(getStudentQuery(id));
    if (!oldStudent) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const student = await Student.findOneAndUpdate(
      getStudentQuery(id),
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (updates.classId && oldStudent.classId !== updates.classId) {
      // Remove from old class
      await Class.findOneAndUpdate(
        getClassQuery(oldStudent.classId),
        { $pull: { studentIds: oldStudent.id } }
      );
      // Add to new class
      await Class.findOneAndUpdate(
        getClassQuery(updates.classId),
        { $addToSet: { studentIds: student?.id } }
      );
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findOneAndDelete(getStudentQuery(id));
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    // Remove from class studentIds
    await Class.findOneAndUpdate(
      getClassQuery(student.classId),
      { $pull: { studentIds: student.id } }
    );
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};
