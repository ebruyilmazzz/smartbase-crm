import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'Yetkisiz erişim.', 401);
  }

  if (err.name === 'NotFoundError') {
    return sendError(res, err.message || 'Kayıt bulunamadı.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Sunucu kaynaklı bir hata oluştu. Lütfen tekrar deneyiniz.' 
    : err.message || 'Sunucu hatası';

  return sendError(res, message, statusCode);
};
