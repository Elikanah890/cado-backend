import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.expiry as any,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID(), type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.secret);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
