import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types/index.js';
import { sendError } from '../utils/response.js';

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Yetkilendirme gerekli.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Bu işlem için yetkiniz bulunmamaktadır.', 403);
    }

    next();
  };
};

export const requireAdmin = requireRoles(['ADMIN']);
export const requireSalesOrAdmin = requireRoles(['ADMIN', 'SALES']);
