import express from 'express';
import { 
  searchClasses, 
  getAllClasses, 
  getClassById, 
  createClass, 
  updateClass, 
  deleteClass, 
  getClassMembers 
} from '../controllers/classes.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllClasses);
router.get('/search', verifyToken, searchClasses);
router.get('/:id', verifyToken, getClassById);
router.post('/', verifyToken, requireRole('admin'), createClass);
router.put('/:id', verifyToken, requireRole('admin'), updateClass);
router.delete('/:id', verifyToken, requireRole('admin'), deleteClass);
router.get('/:id/members', verifyToken, getClassMembers);

export default router;
