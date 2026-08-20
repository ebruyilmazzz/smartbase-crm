import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbase-crm-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );
};

export const verifyToken = (token: string): AuthenticatedUser => {
  return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
};
