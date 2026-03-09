import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadService } from './upload.service.js';
import { verifyToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Upload image
router.post('/image', verifyToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    const result = await uploadService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    sendSuccess(res, result, 'Image uploaded successfully');
  } catch (error: any) {
    console.error('Image upload error:', error);
    sendError(res, error.message || 'Image upload failed', 500);
  }
});

// Upload video
router.post('/video', verifyToken, upload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No video file provided', 400);
    }

    const result = await uploadService.uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    sendSuccess(res, result, 'Video uploaded successfully');
  } catch (error: any) {
    console.error('Video upload error:', error);
    sendError(res, error.message || 'Video upload failed', 500);
  }
});

// Delete file
router.delete('/file', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return sendError(res, 'File URL is required', 400);
    }

    await uploadService.deleteFile(url);

    sendSuccess(res, null, 'File deleted successfully');
  } catch (error: any) {
    console.error('File deletion error:', error);
    sendError(res, error.message || 'File deletion failed', 500);
  }
});

export default router;
