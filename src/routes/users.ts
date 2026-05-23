import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, sendEmailToUser, createUser } from '../controllers/users.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// All user routes require admin role
router.get('/', verifyToken, requireRole('admin', 'teacher', 'parent'), getAllUsers);
router.post('/', verifyToken, requireRole('admin'), createUser);
router.get('/:id', verifyToken, requireRole('admin'), getUserById);
router.put('/:id', verifyToken, requireRole('admin'), updateUser);
router.delete('/:id', verifyToken, requireRole('admin'), deleteUser);
router.post('/:id/email', verifyToken, requireRole('admin'), sendEmailToUser);

export default router;
