import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../utils/prisma.js';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Yetkilendirme belirteci bulunamadı.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, status: true }
    });

    if (!user) {
      return sendError(res, 'Kullanıcı bulunamadı.', 401);
    }

    if (user.status === 'DISABLED') {
      return sendError(res, 'Kullanıcı hesabı devre dışı bırakılmış.', 403);
    }

    req.user = user as any;
    next();
  } catch (error) {
    return sendError(res, 'Geçersiz veya süresi dolmuş oturum.', 401);
  }
};
