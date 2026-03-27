import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { generateId } from '../utils/helpers.js';

export interface VideoProcessingOptions {
  inputPath: string;
  outputDir: string;
  targetResolution?: '720p' | '480p' | '360p';
  generateThumbnail?: boolean;
  thumbnailTime?: string; // HH:MM:SS or seconds
}

export interface VideoProcessingResult {
  outputPath: string;
  thumbnailPath?: string;
  duration?: number;
  resolution?: string;
  fileSize: number;
}

export class VideoProcessingService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

  validateVideoFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return { valid: false, error: `Invalid video type. Allowed: ${this.ALLOWED_VIDEO_TYPES.join(', ')}` };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Max size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true };
  }

  async processVideo(options: VideoProcessingOptions): Promise<VideoProcessingResult> {
    const { inputPath, outputDir, targetResolution = '720p', generateThumbnail = true, thumbnailTime = '00:00:01' } = options;

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const videoId = generateId();
    const outputFilename = `${videoId}_processed.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Get video dimensions for scaling
    const scaleFilter = this.getScaleFilter(targetResolution);

    return new Promise((resolve, reject) => {
      let duration: number | undefined;
      let resolution: string | undefined;

      ffmpeg(inputPath)
        .ffprobe((err, metadata) => {
          if (!err) {
            duration = metadata.format.duration;
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            if (videoStream) {
              resolution = `${videoStream.width}x${videoStream.height}`;
            }
          }
        })
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate('2000k')
        .audioBitrate('128k')
        .fps(30)
        .addOption('-preset', 'fast')
        .addOption('-crf', '23')
        .addOption('-movflags', '+faststart') // Web optimization
        .videoFilter(scaleFilter)
        .on('start', (commandLine) => {
          console.log('[VideoProcessing] Starting FFmpeg:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`[VideoProcessing] Processing: ${progress.percent?.toFixed(1)}% done`);
        })
        .on('error', (err) => {
          console.error('[VideoProcessing] FFmpeg error:', err);
          reject(err);
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);

            // Generate thumbnail if requested
            let thumbnailPath: string | undefined;
            if (generateThumbnail) {
              thumbnailPath = await this.generateThumbnail(outputPath, outputDir, videoId, thumbnailTime);
            }

            resolve({
              outputPath,
              thumbnailPath,
              duration,
              resolution,
              fileSize: stats.size,
            });
          } catch (err) {
            reject(err);
          }
        })
        .save(outputPath);
    });
  }

  private getScaleFilter(targetResolution: string): string {
    const resolutions: Record<string, string> = {
      '720p': 'scale=-2:720',
      '480p': 'scale=-2:480',
      '360p': 'scale=-2:360',
    };
    return resolutions[targetResolution] || 'scale=-2:720';
  }

  private async generateThumbnail(
    videoPath: string,
    outputDir: string,
    videoId: string,
    time: string
  ): Promise<string> {
    const thumbnailFilename = `${videoId}_thumbnail.jpg`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [time],
          filename: thumbnailFilename,
          folder: outputDir,
          size: '480x270',
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', (err) => {
          console.error('[VideoProcessing] Thumbnail error:', err);
          // Don't fail the whole process if thumbnail fails
          resolve('');
        });
    });
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log('[VideoProcessing] Cleaned up:', filePath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      await Promise.all(files.map(file => this.cleanupFile(path.join(dirPath, file))));
      await fs.rmdir(dirPath);
      console.log('[VideoProcessing] Cleaned up directory:', dirPath);
    } catch {
      // Directory doesn't exist or is not empty, ignore
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
