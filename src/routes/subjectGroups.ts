import { Router } from 'express';
import {
  getAllSubjectGroups,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup
} from '../controllers/subjectGroups.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

// All routes require admin access
router.use(requireRole('admin'));

router.get('/', getAllSubjectGroups);
router.post('/', createSubjectGroup);
router.put('/:id', updateSubjectGroup);
router.delete('/:id', deleteSubjectGroup);

export default router;
