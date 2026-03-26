import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const key = `${Date.now()}-${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: options.contentType || 'application/octet-stream',
    });

    await s3Client.send(command);

    return `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file to storage');
  }
}

export async function deleteFromR2(url: string): Promise<void> {
  try {
    const key = url.split(`${env.R2_BUCKET_NAME}/`)[1];
    if (!key) {
      throw new Error('Invalid URL format');
    }

    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error('Failed to delete file from storage');
  }
}

export async function getSignedUploadUrl(
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    const key = `uploads/${Date.now()}-${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error('Error generating signed upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error('Error generating signed download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

export { s3Client };
