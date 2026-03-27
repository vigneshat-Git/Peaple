import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { uploadService } from './upload.service.js';
import { videoQueue, addVideoProcessingJob, getJobStatus } from '../../config/video-queue.js';
import { verifyToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

// Configure multer for disk storage (for video processing)
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime', // MOV
      'video/x-msvideo', // AVI
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, OGG, MOV, and AVI are allowed.'));
    }
  },
});

// Configure multer for memory storage (for images)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, HEIC, and HEIF are allowed.'));
    }
  },
});

/**
 * Upload image - immediate processing
 */
router.post('/image', verifyToken, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    const result = await uploadService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    sendSuccess(res, {
      url: result.url,
      type: 'image',
      status: 'ready',
    }, 'Image uploaded successfully');
  } catch (error: any) {
    console.error('Image upload error:', error);
    sendError(res, error.message || 'Image upload failed', 500);
  }
});

/**
 * Upload video - background processing
 */
router.post('/video', verifyToken, videoUpload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No video file provided', 400);
    }

    const inputPath = req.file.path;
    const outputName = `processed-${Date.now()}-${uuidv4()}.mp4`;
    const outputPath = path.join(os.tmpdir(), outputName);

    // Add to processing queue
    const job = await addVideoProcessingJob(
      inputPath,
      outputPath,
      req.file.originalname,
      undefined, // postId will be set when creating post
      req.user?.userId
    );

    // Return immediately with job ID for tracking
    sendSuccess(res, {
      jobId: job.id,
      status: 'processing',
      message: 'Video is being processed. Check status with /upload/video/status/:jobId',
    }, 'Video upload accepted for processing', 202);
  } catch (error: any) {
    console.error('Video upload error:', error);
    sendError(res, error.message || 'Video upload failed', 500);
  }
});

/**
 * Get video processing status
 */
router.get('/video/status/:jobId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return sendError(res, 'Job not found', 404);
    }

    sendSuccess(res, {
      jobId,
      status: status.status,
      progress: status.progress,
    });
  } catch (error: any) {
    console.error('Get video status error:', error);
    sendError(res, error.message || 'Failed to get video status', 500);
  }
});

/**
 * Upload media for post creation (handles both images and videos)
 */
router.post('/media', verifyToken, videoUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file provided', 400);
    }

    const isVideo = req.file.mimetype.startsWith('video/');

    if (isVideo) {
      // Process video in background
      const inputPath = req.file.path;
      const outputName = `processed-${Date.now()}-${uuidv4()}.mp4`;
      const outputPath = path.join(os.tmpdir(), outputName);

      const job = await addVideoProcessingJob(
        inputPath,
        outputPath,
        req.file.originalname,
        undefined,
        req.user?.userId
      );

      sendSuccess(res, {
        jobId: job.id,
        type: 'video',
        status: 'processing',
        originalUrl: null, // Will be available after processing
      }, 'Video accepted for processing', 202);
    } else {
      // Process image immediately
      const buffer = await fs.readFile(req.file.path);
      const result = await uploadService.uploadImage(
        buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Clean up temp file
      await fs.unlink(req.file.path);

      sendSuccess(res, {
        url: result.url,
        type: 'image',
        status: 'ready',
      }, 'Image uploaded successfully');
    }
  } catch (error: any) {
    console.error('Media upload error:', error);
    sendError(res, error.message || 'Media upload failed', 500);
  }
});

/**
 * Delete file
 */
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
