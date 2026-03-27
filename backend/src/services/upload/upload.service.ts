import { uploadToR2, deleteFromR2 } from '../../config/storage.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResponse {
  url: string;
  message: string;
}

export class UploadService {
  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<UploadResponse> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(contentType)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.length > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      const url = await uploadToR2(file, fileName, { contentType });

      return {
        url,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadVideo(file: Buffer, fileName: string, contentType: string): Promise<UploadResponse> {
    try {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(contentType)) {
        throw new Error('Invalid file type. Only MP4, WebM, OGG, MOV, and AVI are allowed.');
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.length > maxSize) {
        throw new Error('File size too large. Maximum size is 100MB.');
      }

      // Convert video to H.264/AAC for universal compatibility
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `input-${uuidv4()}-${fileName}`);
      const outputPath = path.join(tempDir, `converted-${uuidv4()}.mp4`);

      // Write input file
      await fs.writeFile(inputPath, file);

      // Convert video using FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-crf 23',
            '-movflags +faststart',
            '-pix_fmt yuv420p',
            '-vf scale=-2:720', // Max 720p for compatibility
          ])
          .on('start', (cmd) => {
            console.log('[FFmpeg] Converting video:', cmd);
          })
          .on('end', () => {
            console.log('[FFmpeg] Conversion complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('[FFmpeg] Conversion error:', err);
            reject(err);
          })
          .save(outputPath);
      });

      // Read converted file and upload to R2
      const convertedBuffer = await fs.readFile(outputPath);
      const url = await uploadToR2(convertedBuffer, `${uuidv4()}-converted.mp4`, { contentType: 'video/mp4' });

      // Cleanup temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      return {
        url,
        message: 'Video uploaded and converted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      await deleteFromR2(url);
    } catch (error) {
      throw error;
    }
  }
}

export const uploadService = new UploadService();
