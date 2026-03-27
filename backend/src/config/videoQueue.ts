import { Queue } from 'bullmq';
import { env } from './env.js';

// Video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Job types
export interface VideoProcessingJob {
  postId: string;
  userId: string;
  tempFilePath: string;
  originalFilename: string;
  mimeType: string;
}

export async function addVideoProcessingJob(jobData: VideoProcessingJob): Promise<string> {
  const job = await videoQueue.add('process-video', jobData, {
    priority: 1,
  });
  console.log(`[VideoQueue] Added job ${job.id} for post ${jobData.postId}`);
  return job.id || '';
}

export async function closeVideoQueue(): Promise<void> {
  await videoQueue.close();
}
