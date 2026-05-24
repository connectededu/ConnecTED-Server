import { Router } from 'express';
import { uploadFile, uploadParser } from '../controllers/upload.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware
router.use(verifyToken);

// Handle file uploads (e.g. for profile pictures or attachments)
router.post('/', uploadParser.single('file'), uploadFile);

export default router;
