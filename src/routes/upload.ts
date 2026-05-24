import { Router } from 'express';
import { uploadFile, uploadParser } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware
router.use(authenticate);

// Handle file uploads (e.g. for profile pictures or attachments)
router.post('/', uploadParser.single('file'), uploadFile);

export default router;
