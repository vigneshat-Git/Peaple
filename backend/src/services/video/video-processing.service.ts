import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { uploadToR2, deleteFromR2 } from '../../config/storage.js';

export interface VideoProcessingResult {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  format: string;
}

export class VideoProcessingService {
  /**
   * Convert video to MP4/H.264/AAC format optimized for web
   */
  async processVideo(
    inputPath: string,
    outputPath: string,
    options: {
      generateThumbnail?: boolean;
      thumbnailPath?: string;
      maxHeight?: number;
    } = {}
  ): Promise<VideoProcessingResult> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart', // Enable streaming
          '-pix_fmt yuv420p', // Ensure compatibility
        ]);

      // Limit resolution if specified (e.g., 720p)
      if (options.maxHeight) {
        command.size(`?x${options.maxHeight}`);
      }

      command
        .on('start', (cmd) => {
          console.log('[FFmpeg] Starting:', cmd);
        })
        .on('progress', (progress) => {
          console.log('[FFmpeg] Progress:', progress.percent, '%');
        })
        .on('end', async () => {
          console.log('[FFmpeg] Processing complete');
          try {
            // Get video metadata
            const metadata = await this.getVideoMetadata(outputPath);
            
            // Generate thumbnail if requested
            let thumbnailUrl: string | undefined;
            if (options.generateThumbnail && options.thumbnailPath) {
              await this.generateThumbnail(outputPath, options.thumbnailPath, 1);
              const thumbnailBuffer = await fs.readFile(options.thumbnailPath);
              thumbnailUrl = await uploadToR2(
                thumbnailBuffer,
                path.basename(options.thumbnailPath),
                { contentType: 'image/jpeg' }
              );
            }

            // Upload processed video to R2
            const videoBuffer = await fs.readFile(outputPath);
            const videoUrl = await uploadToR2(
              videoBuffer,
              path.basename(outputPath),
              { contentType: 'video/mp4' }
            );

            resolve({
              url: videoUrl,
              thumbnailUrl,
              duration: metadata.duration,
              width: metadata.width,
              height: metadata.height,
              format: 'mp4',
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          console.error('[FFmpeg] Error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Generate thumbnail from video at specified time
   */
  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeInSeconds: number = 1
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360',
        })
        .on('end', () => {
          console.log('[FFmpeg] Thumbnail generated');
          resolve();
        })
        .on('error', (err) => {
          console.error('[FFmpeg] Thumbnail error:', err);
          reject(err);
        });
    });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoPath: string): Promise<{
    duration?: number;
    width?: number;
    height?: number;
    bitrate?: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        
        resolve({
          duration: metadata.format.duration,
          width: videoStream?.width,
          height: videoStream?.height,
          bitrate: metadata.format.bitrate ? parseInt(metadata.format.bitrate) : undefined,
        });
      });
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanup(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
        console.log('[Cleanup] Deleted:', file);
      } catch (error) {
        console.warn('[Cleanup] Failed to delete:', file, error);
      }
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
