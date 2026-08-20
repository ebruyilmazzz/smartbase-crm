import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return sendError(res, 'E-posta adresi veya şifre hatalı.', 401);
    }

    if (user.status === 'DISABLED') {
      return sendError(res, 'Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'E-posta adresi veya şifre hatalı.', 401);
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
    };

    const token = generateToken(authUser);

    return sendSuccess(res, {
      token,
      user: authUser,
    }, 'Giriş başarılı.');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Giriş yapılırken bir hata oluştu.', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Oturum bulunamadı.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'Kullanıcı bulunamadı.', 404);
    }

    return sendSuccess(res, user);
  } catch (error) {
    console.error('getMe error:', error);
    return sendError(res, 'Kullanıcı bilgisi alınamadı.', 500);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  return sendSuccess(res, null, 'Oturum kapatıldı.');
};
