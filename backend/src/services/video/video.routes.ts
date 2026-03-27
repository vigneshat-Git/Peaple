import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { verifyToken } from '../../middleware/auth.js';
import { videoProcessingService } from './videoProcessing.service.js';
import { addVideoProcessingJob } from '../../config/videoQueue.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { postService } from '../posts/post.service.js';
import { env } from '../../config/env.js';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = env.TEMP_DIR || './temp';
    await fs.mkdir(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video type. Allowed: MP4, WebM, QuickTime, MKV'));
    }
  },
});

// Upload video and create post with processing status
router.post('/upload', verifyToken, upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!req.file) {
      return sendError(res, 'No video uploaded', 400);
    }

    // Validate video file
    const validation = videoProcessingService.validateVideoFile(req.file);
    if (!validation.valid) {
      // Clean up the uploaded file
      await fs.unlink(req.file.path);
      return sendError(res, validation.error || 'Invalid video file', 400);
    }

    const { title, content, communityId } = req.body;

    if (!title || !communityId) {
      await fs.unlink(req.file.path);
      return sendError(res, 'Title and community are required', 400);
    }

    // Create post with processing status
    const post = await postService.createPost(
      title,
      content || '',
      req.user.userId,
      communityId,
      undefined, // No media_url yet
      [{ type: 'video', url: '', fileName: req.file.originalname }] // Placeholder
    );

    // Update post to show processing status
    await postService.updatePost(post.id, req.user.userId, {
      video_status: 'processing',
    } as any);

    // Add video to processing queue
    const jobId = await addVideoProcessingJob({
      postId: post.id,
      userId: req.user.userId,
      tempFilePath: req.file.path,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    console.log(`[VideoRoutes] Video uploaded, job ${jobId} queued for post ${post.id}`);

    sendSuccess(res, {
      post,
      status: 'processing',
      message: 'Video is being processed. Check back shortly.',
    }, 'Video upload accepted for processing', 202);
  } catch (error: any) {
    console.error('Video upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    sendError(res, error.message || 'Failed to upload video', 500);
  }
});

// Get video processing status
router.get('/status/:postId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    const post = await postService.getPostById(postId);
    if (!post) {
      return sendError(res, 'Post not found', 404);
    }

    // Get media info from database
    const mediaResult = await query(
      `SELECT * FROM media WHERE post_id = $1 AND type = 'video'`,
      [postId]
    );

    const videoMedia = mediaResult.rows[0];
    const metadata = videoMedia?.metadata ? JSON.parse(videoMedia.metadata) : {};

    sendSuccess(res, {
      status: post.video_status || (videoMedia ? 'ready' : 'processing'),
      url: videoMedia?.url,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
    });
  } catch (error: any) {
    console.error('Get video status error:', error);
    sendError(res, error.message || 'Failed to get video status', 500);
  }
});

// Import query for status endpoint
import { query } from '../../config/database.js';

export default router;
