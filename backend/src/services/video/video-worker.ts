import { Worker, Job } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { redisConnection } from '../../config/video-queue.js';
import { videoProcessingService } from './video-processing.service.js';
import { query } from '../../config/database.js';

// Temporary directory for processing
const TEMP_DIR = os.tmpdir();

/**
 * Process video job
 */
async function processVideoJob(job: Job): Promise<{
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  status: 'ready' | 'failed';
}> {
  const { inputPath, outputPath, originalName, postId, userId } = job.data;
  
  console.log(`[VideoWorker] Processing job ${job.id}:`, originalName);
  
  const tempFiles: string[] = [];
  
  try {
    // Update job progress
    await job.updateProgress(10);
    
    // Check FFmpeg availability first
    const ffmpegAvailable = await videoProcessingService.isFFmpegAvailable();
    if (!ffmpegAvailable) {
      console.warn(`[VideoWorker] FFmpeg not available for job ${job.id}, uploading as-is`);
    }
    
    // Process video (with fallback if FFmpeg unavailable)
    const result = await videoProcessingService.processVideoSafe(
      inputPath,
      outputPath,
      originalName,
      {
        generateThumbnail: ffmpegAvailable, // Only generate thumbnail if FFmpeg available
        thumbnailPath: outputPath.replace('.mp4', '-thumb.jpg'),
        maxHeight: 720, // Limit to 720p
      }
    );
    
    await job.updateProgress(80);
    
    // Track temp files for cleanup
    tempFiles.push(inputPath, outputPath);
    if (result.thumbnailUrl) {
      tempFiles.push(outputPath.replace('.mp4', '-thumb.jpg'));
    }
    
    // If postId provided, update the post with processed video info
    if (postId) {
      await query(
        `UPDATE media 
         SET url = $1, 
             thumbnail_url = $2,
             duration = $3,
             status = 'ready',
             processed = true
         WHERE post_id = $4 AND type = 'video'`,
        [result.url, result.thumbnailUrl, result.duration, postId]
      );
    }
    
    await job.updateProgress(100);
    
    console.log(`[VideoWorker] Job ${job.id} completed successfully`);
    
    return {
      videoUrl: result.url,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      status: 'ready',
    };
  } catch (error) {
    console.error(`[VideoWorker] Job ${job.id} failed:`, error);
    
    // Update media status to failed
    if (postId) {
      await query(
        `UPDATE media SET status = 'failed' WHERE post_id = $1 AND type = 'video'`,
        [postId]
      );
    }
    
    throw error;
  } finally {
    // Clean up temp files
    await videoProcessingService.cleanup(tempFiles);
  }
}

/**
 * Create and start video processing worker
 */
export function createVideoWorker(): Worker {
  const worker = new Worker(
    'video-processing',
    async (job: Job) => {
      if (job.name === 'process-video') {
        return processVideoJob(job);
      }
      throw new Error(`Unknown job type: ${job.name}`);
    },
    {
      connection: redisConnection,
      concurrency: 2, // Process 2 videos at a time
    }
  );

  worker.on('completed', (job) => {
    console.log(`[VideoWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[VideoWorker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[VideoWorker] Worker error:', err);
  });

  console.log('[VideoWorker] Started');
  return worker;
}

export default createVideoWorker;
