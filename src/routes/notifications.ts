import express from 'express';
import { 
  getAllNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  getUnreadCount 
} from '../controllers/notifications.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.patch('/read-all', verifyToken, markAllNotificationsRead);
router.patch('/:id/read', verifyToken, markNotificationRead);

export default router;
