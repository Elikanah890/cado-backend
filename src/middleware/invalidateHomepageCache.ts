import { Request, Response, NextFunction } from 'express';
import { invalidateHomepageCache } from '../controllers/homepage.controller';

export async function invalidateHomepageCacheOnWrite(req: Request, _res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    await invalidateHomepageCache();
  }
  next();
}
