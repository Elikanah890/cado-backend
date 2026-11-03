import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const isPlaceholder = (value: string | undefined): boolean =>
  !value || value === 'your_cloudinary_name' || value === 'your_cloudinary_api_key' || value === 'your_cloudinary_api_secret';

const CLOUDINARY_TIMEOUT_MS = 120_000;
const VIDEO_CHUNK_SIZE = 6_000_000;
const MAX_VIDEO_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB) || 100;

function logCloudinaryError(error: any, kind: 'video' | 'image'): void {
  const status = error?.http_code || error?.statusCode || error?.response?.status;
  const message =
    error?.response?.data?.error?.message ||
    error?.error?.message ||
    error?.message ||
    'Unknown Cloudinary error';

  if (status === 413 || /too large|file size|maximum/i.test(message)) {
    logger.error(`[upload] ${kind} exceeds the Cloudinary size limit (${MAX_VIDEO_SIZE_MB}MB): ${message}`);
    return;
  }
  if (/timeout|timed out|ETIMEDOUT|ECONNABORTED|socket hang up|network/i.test(message)) {
    logger.error(`[upload] ${kind} upload timed out or the network failed: ${message}`);
    return;
  }
  logger.error(`[upload] ${kind} upload failed${status ? ` (status ${status})` : ''}: ${message}`);
}

export const uploadToLocal = async (file: Express.Multer.File, folder: string = 'general'): Promise<string> => {
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(folderPath, fileName);

  await fs.promises.writeFile(filePath, file.buffer);

  return `/uploads/${folder}/${fileName}`;
};

export const uploadToCloudinary = async (file: Express.Multer.File, folder: string = 'cador'): Promise<string> => {
  const { config } = await import('../config');
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  const isConfigured =
    !isPlaceholder(cloudName) && !isPlaceholder(apiKey) && !isPlaceholder(apiSecret);

  if (!isConfigured) {
    logger.warn(
      '[upload] Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET). Falling back to local storage. ' +
        'Local files are ephemeral on Render — configure Cloudinary to persist media.'
    );
    return uploadToLocal(file, folder);
  }

  const isVideo = file.mimetype.startsWith('video/');
  const publicId = `cador_${uuidv4()}`;

  // Large videos: use Cloudinary's chunked/resumable upload API instead of a
  // single multipart POST. This is what allows files above ~100MB to finish
  // reliably and gives the SDK room to retry individual chunks.
  if (isVideo) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const extension = path.extname(file.originalname) || '.mp4';
    const tempPath = path.join(os.tmpdir(), `cador-${uuidv4()}${extension}`);

    try {
      await fs.promises.writeFile(tempPath, file.buffer);

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_large(
          tempPath,
          {
            resource_type: 'video',
            folder,
            public_id: publicId,
            timeout: CLOUDINARY_TIMEOUT_MS,
            chunk_size: VIDEO_CHUNK_SIZE,
          },
          (error: any, uploadResult: any) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );
      });

      if (!result?.secure_url) {
        throw new Error('Cloudinary response did not include a secure_url');
      }

      return result.secure_url;
    } catch (error: any) {
      logCloudinaryError(error, 'video');
      // Best-effort fallback so the admin still gets a saved file.
      return uploadToLocal(file, folder);
    } finally {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }

  // Images and PDFs continue through the existing signed multipart upload.
  const resourceType = 'image';
  const FormData = (await import('form-data')).default;
  const axios = (await import('axios')).default;
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string> = {
    folder,
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signature = crypto
    .createHash('sha1')
    .update(
      Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key]}`)
        .join('&') + apiSecret
    )
    .digest('hex');

  const formData = new FormData();
  formData.append('file', file.buffer, file.originalname);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      formData,
      { headers: { ...formData.getHeaders() }, timeout: CLOUDINARY_TIMEOUT_MS }
    );

    if (!response.data?.secure_url) {
      throw new Error('Cloudinary response did not include a secure_url');
    }

    return response.data.secure_url;
  } catch (error: any) {
    logCloudinaryError(error, 'image');
    return uploadToLocal(file, folder);
  }
};

export const uploadFile = async (file: Express.Multer.File, folder: string = 'general'): Promise<{ url: string; fileName: string }> => {
  const url = await uploadToCloudinary(file, folder);
  return { url, fileName: file.originalname };
};

export const deleteLocalFile = (filePath: string): void => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
