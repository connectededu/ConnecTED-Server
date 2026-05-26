import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student';
import Class from '../models/Class';
import User from '../models/User';
import Grade from '../models/Grade';
import Attendance from '../models/Attendance';
import Homework from '../models/Homework';
import Announcement from '../models/Announcement';
import Event from '../models/Event';
import AuditLog from '../models/AuditLog';

const getGrowthPercentage = async (model: any, filter: any = {}): Promise<string> => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const lastMonthCount = await model.countDocuments({
    ...filter,
    createdAt: { $lt: startOfThisMonth }
  });
  
  const thisMonthNewCount = await model.countDocuments({
    ...filter,
    createdAt: { $gte: startOfThisMonth }
  });

  if (lastMonthCount === 0) {
    if (filter.role === 'parent') return '0%';
    if (filter.role === 'teacher') return '0%';
    return '0%';
  }

  const growth = (thisMonthNewCount / lastMonthCount) * 100;
  const roundedGrowth = Math.round(growth);
  
  return roundedGrowth >= 0 ? `+${roundedGrowth}%` : `${roundedGrowth}%`;
};

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { role } = req.user;
    const userId = req.user.id || req.user._id.toString();

    // 1. ADMIN ANALYTICS
    if (role === 'admin') {
      const totalStudents = await Student.countDocuments();
      const totalParents = await User.countDocuments({ role: 'parent' });
      const totalTeachers = await User.countDocuments({ role: 'teacher' });
      const totalClasses = await Class.countDocuments();
      
      const pendingApprovals = await User.countDocuments({ isApproved: false });

      // Calculate growth percentages dynamically from the database
      const studentGrowth = await getGrowthPercentage(Student);
      const parentGrowth = await getGrowthPercentage(User, { role: 'parent' });
      const teacherGrowth = await getGrowthPercentage(User, { role: 'teacher' });

      // Calculate global attendance rate
      const attendanceRecords = await Attendance.find();
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const attendanceRate = attendanceRecords.length > 0 
        ? Math.round((presentCount / attendanceRecords.length) * 100) 
        : null;

      // Calculate global grade average
      const gradeRecords = await Grade.find();
      const gradeAverage = gradeRecords.length > 0
        ? Math.round(gradeRecords.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / gradeRecords.length)
        : null;

      // Group grade averages by subject
      const subjectScores: Record<string, { total: number; count: number }> = {};
      gradeRecords.forEach(g => {
        if (!subjectScores[g.subject]) {
          subjectScores[g.subject] = { total: 0, count: 0 };
        }
        subjectScores[g.subject].total += (g.score / g.maxScore) * 100;
        subjectScores[g.subject].count += 1;
      });

      const gradeData = Object.keys(subjectScores).map(subject => ({
        name: subject,
        avg: Math.round(subjectScores[subject].total / subjectScores[subject].count)
      }));

      // Generate real daily attendance rate breakdown for chart
      const now = new Date();
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      monday.setHours(0,0,0,0);
      const endOfWeek = new Date(monday);
      endOfWeek.setDate(monday.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);

      const weekAttendance = await Attendance.find({
        date: { $gte: monday, $lte: endOfWeek }
      });

      const dailyStats: Record<number, { total: number, present: number }> = {
        1: { total: 0, present: 0 },
        2: { total: 0, present: 0 },
        3: { total: 0, present: 0 },
        4: { total: 0, present: 0 },
        5: { total: 0, present: 0 },
      };

      weekAttendance.forEach(a => {
        const day = new Date(a.date).getDay();
        if (day >= 1 && day <= 5) {
          dailyStats[day].total += 1;
          if (a.status === 'present' || a.status === 'late') {
            dailyStats[day].present += 1;
          }
        }
      });

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const attendanceData = [1, 2, 3, 4, 5].map((dayNum, idx) => {
        const stats = dailyStats[dayNum];
        const presentPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
        return {
          name: dayNames[idx],
          present: presentPct,
          absent: stats.total > 0 ? 100 - presentPct : 0
        };
      });

      // Fetch recent activity from AuditLog (last 5 entries)
      const recentLogs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();

      // Collect adminIds
      const adminIds = [...new Set(recentLogs.map(l => l.adminId).filter(Boolean))];
      const validAdminIds = adminIds.filter(id => id !== 'system' && id !== 'anonymous');
      
      const admins = validAdminIds.length > 0 
        ? await User.find({ 
            $or: [
              { _id: { $in: validAdminIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
              { firebaseUid: { $in: validAdminIds } }
            ]
          }).select('name _id firebaseUid').lean()
        : [];

      const adminMap: Record<string, string> = {};
      admins.forEach(a => {
        adminMap[(a as any)._id.toString()] = a.name;
        if ((a as any).firebaseUid) adminMap[(a as any).firebaseUid] = a.name;
      });

      const recentActivity = recentLogs.map((log: any) => {
        const now = new Date();
        const logTime = new Date(log.timestamp);
        const diffMs = now.getTime() - logTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo: string;
        if (diffMins < 1) timeAgo = 'just now';
        else if (diffMins < 60) timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        else timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

        const adminName = adminMap[log.adminId] || 'System';

        return {
          type: log.targetType || 'system',
          message: `${adminName} ${log.details?.toLowerCase() || log.action}`,
          time: timeAgo,
        };
      });

      res.json({
        totalStudents,
        totalParents,
        totalTeachers,
        totalClasses,
        pendingApprovals,
        attendanceRate,
        gradeAverage,
        studentGrowth,
        parentGrowth,
        teacherGrowth,
        gradeData,
        attendanceData,
        recentActivity,
      });
      return;
    }

    // 2. TEACHER ANALYTICS
    if (role === 'teacher') {
      // Find classes taught by this teacher
      const teacherClasses = await Class.find({ teacherIds: userId });
      const classIds = teacherClasses.map(c => c.id);

      const totalClasses = teacherClasses.length;
      
      // Find students in these classes
      const teacherStudents = await Student.find({ classId: { $in: classIds } });
      const totalStudents = teacherStudents.length;

      // Find attendance records for these classes
      const attendanceRecords = await Attendance.find({ classId: { $in: classIds } });
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const attendanceRate = attendanceRecords.length > 0
        ? Math.round((presentCount / attendanceRecords.length) * 100)
        : null;

      // Find grades for these classes
      const gradeRecords = await Grade.find({ classId: { $in: classIds } });
      const gradeAverage = gradeRecords.length > 0
        ? Math.round(gradeRecords.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / gradeRecords.length)
        : null;

      const activeAssignments = await Homework.countDocuments({ classId: { $in: classIds } });

      res.json({
        totalClasses,
        totalStudents,
        attendanceRate,
        gradeAverage,
        activeAssignments,
        classesSummary: teacherClasses.map(c => ({
          id: c.id,
          name: c.name,
          studentCount: teacherStudents.filter(s => s.classId === c.id).length
        }))
      });
      return;
    }

    // 3. PARENT ANALYTICS
    if (role === 'parent') {
      // Find children linked to this parent
      const myChildren = await Student.find({ parentIds: userId });

      const childrenSummary = await Promise.all(
        myChildren.map(async (child) => {
          const studentAttendance = await Attendance.find({ studentId: child.id });
          const totalAtt = studentAttendance.length;
          const presCount = studentAttendance.filter(a => a.status === 'present').length;
          const childAttendanceRate = totalAtt > 0 ? Math.round((presCount / totalAtt) * 100) : null;

          const studentGrades = await Grade.find({ studentId: child.id });
          const childGradeAverage = studentGrades.length > 0
            ? Math.round(studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / studentGrades.length)
            : null;

          const pendingHomeworkCount = await Homework.countDocuments({ classId: child.classId });

          return {
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            classId: child.classId,
            admissionNumber: child.admissionNumber,
            attendanceRate: childAttendanceRate,
            gradeAverage: childGradeAverage,
            pendingHomeworkCount
          };
        })
      );

      res.json({
        childrenCount: myChildren.length,
        children: childrenSummary
      });
      return;
    }

    res.status(400).json({ error: 'Invalid user role' });
  } catch (error: any) {
    console.error('Failed to get dashboard analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
