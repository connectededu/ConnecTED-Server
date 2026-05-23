import express from 'express';
import { 
  getGrades, 
  createGrade, 
  updateGrade, 
  deleteGrade, 
  publishGrades 
} from '../controllers/grades.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getGrades);
router.post('/', verifyToken, requireRole('admin', 'teacher'), createGrade);
router.put('/:id', verifyToken, requireRole('admin', 'teacher'), updateGrade);
router.delete('/:id', verifyToken, requireRole('admin', 'teacher'), deleteGrade);
router.post('/publish', verifyToken, requireRole('admin', 'teacher'), publishGrades);

export default router;
