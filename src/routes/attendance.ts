import express from 'express';
import { 
  getAttendance, 
  markAttendance, 
  updateAttendance, 
  getStudentAttendanceSummary 
} from '../controllers/attendance.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAttendance);
router.post('/', verifyToken, requireRole('admin', 'teacher'), markAttendance);
router.put('/:id', verifyToken, requireRole('admin', 'teacher'), updateAttendance);
router.get('/student/:studentId', verifyToken, getStudentAttendanceSummary);

export default router;
