import express from 'express';
import { 
  getHomework, 
  getHomeworkById, 
  createHomework, 
  updateHomework, 
  deleteHomework 
} from '../controllers/homework.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getHomework);
router.get('/:id', verifyToken, getHomeworkById);
router.post('/', verifyToken, requireRole('admin', 'teacher'), createHomework);
router.put('/:id', verifyToken, requireRole('admin', 'teacher'), updateHomework);
router.delete('/:id', verifyToken, requireRole('admin', 'teacher'), deleteHomework);

export default router;
