import { Worker, Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { videoProcessingService, VideoProcessingResult } from './videoProcessing.service.js';
import { uploadToR2 } from '../config/storage.js';
import { query } from '../config/database.js';
import type { VideoProcessingJob } from '../config/videoQueue.js';

const TEMP_DIR = env.TEMP_DIR || './temp';

export function createVideoWorker(): Worker {
  const worker = new Worker<VideoProcessingJob>(
    'video-processing',
    async (job: Job<VideoProcessingJob>) => {
      const { postId, userId, tempFilePath, originalFilename } = job.data;

      console.log(`[VideoWorker] Starting processing for job ${job.id}, post ${postId}`);
      
      try {
        // Update post status to processing
        await updatePostStatus(postId, 'processing');

        // Process video
        const result: VideoProcessingResult = await videoProcessingService.processVideo({
          inputPath: tempFilePath,
          outputDir: TEMP_DIR,
          targetResolution: '720p',
          generateThumbnail: true,
          thumbnailTime: '00:00:01',
        });

        console.log(`[VideoWorker] Video processed: ${result.outputPath}`);

        // Upload processed video to R2
        const videoBuffer = await fs.readFile(result.outputPath);
        const videoKey = `videos/${postId}/video.mp4`;
        const videoUrl = await uploadToR2(videoBuffer, videoKey, {
          contentType: 'video/mp4',
        });

        console.log(`[VideoWorker] Video uploaded to R2: ${videoUrl}`);

        // Upload thumbnail if generated
        let thumbnailUrl: string | undefined;
        if (result.thumbnailPath) {
          const thumbBuffer = await fs.readFile(result.thumbnailPath);
          const thumbKey = `videos/${postId}/thumbnail.jpg`;
          thumbnailUrl = await uploadToR2(thumbBuffer, thumbKey, {
            contentType: 'image/jpeg',
          });
          console.log(`[VideoWorker] Thumbnail uploaded to R2: ${thumbnailUrl}`);
        }

        // Update database with processed video info
        await updatePostWithVideo(postId, {
          url: videoUrl,
          thumbnail: thumbnailUrl,
          duration: result.duration,
          status: 'ready',
        });

        console.log(`[VideoWorker] Job ${job.id} completed successfully`);

        // Cleanup temporary files
        await videoProcessingService.cleanupFile(tempFilePath);
        await videoProcessingService.cleanupFile(result.outputPath);
        if (result.thumbnailPath) {
          await videoProcessingService.cleanupFile(result.thumbnailPath);
        }

        return { success: true, videoUrl, thumbnailUrl };
      } catch (error) {
        console.error(`[VideoWorker] Job ${job.id} failed:`, error);
        
        // Update post status to failed
        await updatePostStatus(postId, 'failed');
        
        // Cleanup temp file
        await videoProcessingService.cleanupFile(tempFilePath);
        
        throw error;
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
      concurrency: 2, // Process 2 videos concurrently
    }
  );

  worker.on('completed', (job) => {
    console.log(`[VideoWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[VideoWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}

async function updatePostStatus(postId: string, status: 'processing' | 'ready' | 'failed'): Promise<void> {
  try {
    await query(
      `UPDATE posts SET video_status = $1 WHERE id = $2`,
      [status, postId]
    );
  } catch (error) {
    console.error('[VideoWorker] Failed to update post status:', error);
  }
}

async function updatePostWithVideo(
  postId: string,
  videoData: {
    url: string;
    thumbnail?: string;
    duration?: number;
    status: 'ready';
  }
): Promise<void> {
  // Update media table with processed video
  await query(
    `INSERT INTO media (post_id, url, type, file_name, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (post_id, url) DO UPDATE SET
       metadata = EXCLUDED.metadata`,
    [
      postId,
      videoData.url,
      'video',
      'video.mp4',
      JSON.stringify({
        thumbnail: videoData.thumbnail,
        duration: videoData.duration,
        status: videoData.status,
      }),
    ]
  );

  // Update post media_url for backward compatibility
  await query(
    `UPDATE posts SET media_url = $1 WHERE id = $2`,
    [videoData.url, postId]
  );
}
