import { Client } from 'minio';
import sharp from 'sharp';
import { config } from '../config/index.js';
import crypto from 'crypto';

// Initialize MinIO client
const minioClient = new Client({
  endPoint: config.storage.endpoint,
  port: config.storage.port,
  useSSL: config.storage.useSSL,
  accessKey: config.storage.accessKey,
  secretKey: config.storage.secretKey,
});

const BUCKET_NAME = config.storage.bucket;

// Ensure bucket exists with public read policy
async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
    console.log(`Bucket '${BUCKET_NAME}' created`);
  }

  // Set public read policy
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
      },
    ],
  };

  try {
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  } catch (err) {
    console.warn('Could not set bucket policy:', err);
  }
}

// Initialize on startup
ensureBucket().catch(console.error);

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export const storageService = {
  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    await ensureBucket();

    // Generate unique key
    const ext = filename.split('.').pop() || '';
    const uniqueId = crypto.randomUUID();
    const key = `${folder}/${uniqueId}.${ext}`;

    // Upload to MinIO
    await minioClient.putObject(BUCKET_NAME, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    // Generate URL using public endpoint for browser access
    const url = `http://${config.storage.publicEndpoint}:${config.storage.port}/${BUCKET_NAME}/${key}`;

    return {
      url,
      key,
      size: buffer.length,
      mimeType,
    };
  },

  /**
   * Upload and compress an image
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    folder: string = 'images',
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ): Promise<UploadResult> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 80 } = options;

    // Process image with sharp
    let processedBuffer: Buffer;
    let mimeType: string;

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if needed
      if (metadata.width && metadata.width > maxWidth) {
        image.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });
      }

      // Convert to JPEG for photos, PNG for graphics
      if (metadata.format === 'png' && metadata.hasAlpha) {
        processedBuffer = await image.png({ quality }).toBuffer();
        mimeType = 'image/png';
      } else {
        processedBuffer = await image.jpeg({ quality }).toBuffer();
        mimeType = 'image/jpeg';
      }
    } catch (error) {
      // If sharp fails, upload original
      processedBuffer = buffer;
      mimeType = 'image/jpeg';
    }

    return this.uploadFile(processedBuffer, filename, mimeType, folder);
  },

  /**
   * Upload a floor plan (PDF or image)
   */
  async uploadFloorPlan(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<UploadResult> {
    // For images, compress them
    if (mimeType.startsWith('image/')) {
      return this.uploadImage(buffer, filename, 'floorplans', {
        maxWidth: 4096,
        maxHeight: 4096,
        quality: 90,
      });
    }

    // For PDFs, upload as-is
    return this.uploadFile(buffer, filename, mimeType, 'floorplans');
  },

  /**
   * Delete a file from MinIO
   */
  async deleteFile(key: string): Promise<void> {
    await minioClient.removeObject(BUCKET_NAME, key);
  },

  /**
   * Get a presigned URL for direct download
   */
  async getPresignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return minioClient.presignedGetObject(BUCKET_NAME, key, expirySeconds);
  },

  /**
   * Upload a buffer directly (for generated PDFs, etc.)
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'reports'
  ): Promise<string> {
    const result = await this.uploadFile(buffer, filename, mimeType, folder);
    return result.url;
  },
};
