import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200, meta?: any) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 400, data?: any) => {
  const response: ApiResponse = {
    success: false,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};
