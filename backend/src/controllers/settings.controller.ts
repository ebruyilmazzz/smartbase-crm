import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { logActivity } from '../services/activity.service.js';

// User Management (Admin only)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: { where: { isArchived: false } },
            assignedRequests: { where: { isArchived: false } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, users);
  } catch (error) {
    console.error('getUsers error:', error);
    return sendError(res, 'Kullanıcılar alınamadı.', 500);
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, status = 'ACTIVE' } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return sendError(res, 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: req.user!.id,
      action: 'USER_CREATED',
      description: `${req.user!.name}, "${user.name}" (${user.email} - ${user.role}) adlı kullanıcıyı sisteme ekledi.`,
    });

    return sendSuccess(res, user, 'Kullanıcı başarıyla oluşturuldu.', 201);
  } catch (error) {
    console.error('createUser error:', error);
    return sendError(res, 'Kullanıcı oluşturulamadı.', 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Kullanıcı bulunamadı.', 404);
    }

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email.toLowerCase().trim();
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: req.user!.id,
      action: 'USER_UPDATED',
      description: `${req.user!.name}, "${updated.name}" kullanıcısının profil/yetki bilgilerini güncelledi.`,
    });

    return sendSuccess(res, updated, 'Kullanıcı güncellendi.');
  } catch (error) {
    console.error('updateUser error:', error);
    return sendError(res, 'Kullanıcı güncellenemedi.', 500);
  }
};

// Status Management
export const getStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category) where.category = String(category);

    const statuses = await prisma.customStatus.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return sendSuccess(res, statuses);
  } catch (error) {
    console.error('getStatuses error:', error);
    return sendError(res, 'Durumlar alınamadı.', 500);
  }
};

export const createStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, color, order = 0 } = req.body;

    const status = await prisma.customStatus.create({
      data: { name, category, color, order: Number(order) },
    });

    return sendSuccess(res, status, 'Durum eklendi.', 201);
  } catch (error) {
    console.error('createStatus error:', error);
    return sendError(res, 'Durum eklenemedi.', 500);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order, isActive } = req.body;

    const updated = await prisma.customStatus.update({
      where: { id },
      data: { name, color, order: order !== undefined ? Number(order) : undefined, isActive },
    });

    return sendSuccess(res, updated, 'Durum güncellendi.');
  } catch (error) {
    console.error('updateStatus error:', error);
    return sendError(res, 'Durum güncellenemedi.', 500);
  }
};

// Priority Management
export const getPriorities = async (req: AuthRequest, res: Response) => {
  try {
    const priorities = await prisma.customPriority.findMany({
      orderBy: { order: 'asc' },
    });

    return sendSuccess(res, priorities);
  } catch (error) {
    console.error('getPriorities error:', error);
    return sendError(res, 'Öncelikler alınamadı.', 500);
  }
};

export const createPriority = async (req: AuthRequest, res: Response) => {
  try {
    const { name, color, order = 0 } = req.body;

    const priority = await prisma.customPriority.create({
      data: { name, color, order: Number(order) },
    });

    return sendSuccess(res, priority, 'Öncelik eklendi.', 201);
  } catch (error) {
    console.error('createPriority error:', error);
    return sendError(res, 'Öncelik eklenemedi.', 500);
  }
};

export const updatePriority = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order, isActive } = req.body;

    const updated = await prisma.customPriority.update({
      where: { id },
      data: { name, color, order: order !== undefined ? Number(order) : undefined, isActive },
    });

    return sendSuccess(res, updated, 'Öncelik güncellendi.');
  } catch (error) {
    console.error('updatePriority error:', error);
    return sendError(res, 'Öncelik güncellenemedi.', 500);
  }
};
