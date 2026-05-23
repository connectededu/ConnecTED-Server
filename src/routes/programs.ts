import express from 'express';
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getAllSubjects,
} from '../controllers/programs.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.use(verifyToken);

// Subjects route must be before /:id to avoid "subjects" being parsed as an id
router.get('/subjects', getAllSubjects);

router.get('/', getAllPrograms);
router.get('/:id', getProgramById);

// Admin only routes
router.post('/', requireRole('admin'), createProgram);
router.put('/:id', requireRole('admin'), updateProgram);
router.delete('/:id', requireRole('admin'), deleteProgram);

export default router;
