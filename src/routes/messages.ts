import express from 'express';
import { 
  getThreads, 
  getOrCreateThread, 
  getMessages, 
  sendMessage, 
  markThreadRead 
} from '../controllers/messages.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/threads', verifyToken, getThreads);
router.post('/threads', verifyToken, getOrCreateThread);
router.get('/threads/:threadId/messages', verifyToken, getMessages);
router.post('/threads/:threadId/messages', verifyToken, sendMessage);
router.patch('/threads/:threadId/read', verifyToken, markThreadRead);

export default router;
