import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, companyId, taskId, requestId, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = String(userId);
    if (companyId) where.companyId = String(companyId);
    if (taskId) where.taskId = String(taskId);
    if (requestId) where.requestId = String(requestId);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          company: {
            select: { id: true, companyName: true },
          },
          task: {
            select: { id: true, title: true },
          },
          request: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return sendSuccess(res, activities, undefined, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('getActivities error:', error);
    return sendError(res, 'Aktiviteler alınamadı.', 500);
  }
};
