import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
// It will automatically use CLOUDINARY_URL from process.env if available
cloudinary.config({
  // CLOUDINARY_URL is typically enough, but we can explicitly call config if needed
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'connected_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
  } as any,
});

export const uploadParser = multer({ storage });

export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    // multer-storage-cloudinary adds path/filename to req.file
    res.json({
      url: req.file.path,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};
