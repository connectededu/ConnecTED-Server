import express from 'express';
import { 
  getAllAnnouncements, 
  getAnnouncementById, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement
} from '../controllers/announcements.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllAnnouncements);
router.get('/:id', verifyToken, getAnnouncementById);
router.post('/', verifyToken, requireRole('admin', 'teacher'), createAnnouncement);
router.put('/:id', verifyToken, requireRole('admin', 'teacher'), updateAnnouncement);
router.delete('/:id', verifyToken, requireRole('admin', 'teacher'), deleteAnnouncement);
router.patch('/:id/archive', verifyToken, requireRole('admin', 'teacher'), archiveAnnouncement);
router.patch('/:id/restore', verifyToken, requireRole('admin'), restoreAnnouncement);

export default router;
