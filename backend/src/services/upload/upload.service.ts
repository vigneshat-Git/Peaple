import { uploadToR2, deleteFromR2 } from '../../config/storage.js';
import { sendSuccess, sendError } from '../../utils/response.js';

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
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(contentType)) {
        throw new Error('Invalid file type. Only MP4, WebM, and OGG are allowed.');
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.length > maxSize) {
        throw new Error('File size too large. Maximum size is 100MB.');
      }

      const url = await uploadToR2(file, fileName, { contentType });

      return {
        url,
        message: 'Video uploaded successfully',
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
