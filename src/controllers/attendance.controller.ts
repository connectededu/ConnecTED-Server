import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Attendance from '../models/Attendance';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import Student from '../models/Student';
import { getIO } from '../config/socket';

/**
 * Get attendance records with filters
 */
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, studentId, date, startDate, endDate } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (date) query.date = date;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

/**
 * Mark attendance for one or more students (bulk)
 */
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { records } = req.body; // Array of { studentId, classId, date, status, note }
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'records array is required' });
      return;
    }

    const markedBy = (user as any)._id.toString();
    const results = [];
    const io = getIO();

    for (const record of records) {
      const { studentId, classId, date, status, note } = record;
      // Upsert: one record per student per date
      const attendance = await Attendance.findOneAndUpdate(
        { studentId, date },
        { $set: { id: uuidv4(), studentId, classId, date, status, note, markedBy } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(attendance);

      // Fire real-time notification if student is absent
      if (status === 'absent') {
        const student = await Student.findOne({ $or: [{ _id: studentId }, { id: studentId }] });
        if (student && student.parentIds?.length) {
          for (const parentId of student.parentIds) {
            const notif = new Notification({
              id: uuidv4(),
              userId: parentId,
              type: 'absent',
              title: `${student.name} was marked absent`,
              message: `Your child ${student.name} was marked absent on ${date}.`,
              isRead: false,
              link: `/parent/children/${studentId}`,
            });
            await notif.save();
            // Emit to parent's socket room
            io?.to(`user:${parentId}`).emit('notification', notif);
          }
        }
      }
    }

    await AuditLog.create({
      id: uuidv4(),
      adminId: (user as any)._id.toString(),
      action: 'MARK_ATTENDANCE',
      targetType: 'attendance',
      targetId: 'bulk',
      details: `Marked attendance for ${results.length} students`,
    });

    res.status(201).json({ message: 'Attendance marked successfully', records: results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

/**
 * Update a single attendance record
 */
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const record = await Attendance.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      { $set: updates },
      { new: true }
    );
    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }
    const user = req.user;
    if (user) {
      await AuditLog.create({
        id: uuidv4(),
        adminId: (user as any)._id.toString(),
        action: 'UPDATE_ATTENDANCE',
        targetType: 'attendance',
        targetId: record.id || record._id.toString(),
        details: `Updated attendance record for student ${record.studentId}`,
      });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

/**
 * Get attendance summary for a student
 */
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ studentId });
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
    };
    res.json({ summary, records });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};
