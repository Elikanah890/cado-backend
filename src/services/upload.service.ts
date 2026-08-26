import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

  if (!config.cloudinary.cloudName || config.cloudinary.cloudName === 'your_cloudinary_name') {
    return uploadToLocal(file, folder);
  }

  const FormData = (await import('form-data')).default;
  const axios = (await import('axios')).default;
  const { v4: uuid } = await import('uuid');

  const formData = new FormData();
  formData.append('file', file.buffer, file.originalname);
  formData.append('upload_preset', 'cador_upload');
  formData.append('folder', folder);
  formData.append('public_id', `cador_${uuid()}`);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
    formData,
    { headers: { ...formData.getHeaders() } }
  );

  return response.data.secure_url;
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
