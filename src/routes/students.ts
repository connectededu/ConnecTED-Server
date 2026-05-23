import express from 'express';
import { 
  checkAdmissionNumber, 
  generateAdmissionNumber, 
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/students.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllStudents);
router.get('/check/:admissionNumber', verifyToken, checkAdmissionNumber);
router.get('/generate-id', verifyToken, generateAdmissionNumber);
router.get('/:id', verifyToken, getStudentById);
router.post('/', verifyToken, requireRole('admin'), createStudent);
router.put('/:id', verifyToken, requireRole('admin'), updateStudent);
router.delete('/:id', verifyToken, requireRole('admin'), deleteStudent);

export default router;
