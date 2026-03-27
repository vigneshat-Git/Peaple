import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env';

// Redis connection for BullMQ
const redisConnection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Job types
export interface VideoProcessingJob {
  jobId: string;
  inputPath: string;
  outputPath: string;
  originalName: string;
  postId?: string;
  userId?: string;
}

// Add video processing job
export async function addVideoProcessingJob(
  inputPath: string,
  outputPath: string,
  originalName: string,
  postId?: string,
  userId?: string
): Promise<Job> {
  return videoQueue.add(
    'process-video',
    {
      inputPath,
      outputPath,
      originalName,
      postId,
      userId,
    },
    {
      jobId: `video-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }
  );
}

// Get job status
export async function getJobStatus(jobId: string): Promise<{ status: string; progress?: number } | null> {
  const job = await videoQueue.getJob(jobId);
  if (!job) return null;
  
  const state = await job.getState();
  const progress = typeof job.progress === 'number' ? job.progress : 0;
  
  return { status: state, progress };
}

export { redisConnection };
