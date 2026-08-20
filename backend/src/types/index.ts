import { Request } from 'express';

export type UserRole = 'ADMIN' | 'SALES' | 'DEVELOPER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}
