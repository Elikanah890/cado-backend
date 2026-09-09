import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const isPlaceholder = (value: string | undefined): boolean =>
  !value || value === 'your_cloudinary_name' || value === 'your_cloudinary_api_key' || value === 'your_cloudinary_api_secret';

export const uploadToLocal = async (file: Express.Multer.File, folder: string = 'general'): Promise<string> => {
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(folderPath, fileName);

  fs.writeFileSync(filePath, file.buffer);

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
  const resourceType = isVideo ? 'video' : 'image';

  const FormData = (await import('form-data')).default;
  const axios = (await import('axios')).default;

  const publicId = `cador_${uuidv4()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Signed upload — no upload preset required, works with any Cloudinary account.
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
      { headers: { ...formData.getHeaders() }, timeout: 60000 }
    );

    if (!response.data?.secure_url) {
      throw new Error('Cloudinary response did not include a secure_url');
    }

    return response.data.secure_url;
  } catch (error: any) {
    const message = error?.response?.data?.error?.message || error?.message || 'Cloudinary upload failed';
    logger.error(`[upload] Cloudinary upload failed: ${message}`);
    // Fall back to local storage so uploads still succeed (best-effort) while
    // the misconfiguration is being resolved on the hosting platform.
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
