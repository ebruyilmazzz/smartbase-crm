import { prisma } from '../utils/prisma.js';

interface LogActivityParams {
  userId: string;
  action: string;
  description: string;
  companyId?: string;
  taskId?: string;
  requestId?: string;
}

export const logActivity = async ({
  userId,
  action,
  description,
  companyId,
  taskId,
  requestId,
}: LogActivityParams) => {
  try {
    return await prisma.activity.create({
      data: {
        userId,
        action,
        description,
        companyId,
        taskId,
        requestId,
      },
    });
  } catch (error) {
    console.error('Activity logging failed:', error);
    // Don't fail parent operation if activity logging encounters an issue
    return null;
  }
};
