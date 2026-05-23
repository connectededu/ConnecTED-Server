import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, requireRole('admin'), getAuditLogs);

export default router;
