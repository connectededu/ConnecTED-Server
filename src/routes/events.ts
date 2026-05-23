import express from 'express';
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  rsvpEvent,
  archiveEvent,
  restoreEvent
} from '../controllers/events.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllEvents);
router.get('/:id', verifyToken, getEventById);
router.post('/', verifyToken, requireRole('admin', 'teacher'), createEvent);
router.put('/:id', verifyToken, requireRole('admin', 'teacher'), updateEvent);
router.delete('/:id', verifyToken, requireRole('admin', 'teacher'), deleteEvent);
router.post('/:id/rsvp', verifyToken, rsvpEvent);
router.patch('/:id/archive', verifyToken, requireRole('admin', 'teacher'), archiveEvent);
router.patch('/:id/restore', verifyToken, requireRole('admin'), restoreEvent);

export default router;
