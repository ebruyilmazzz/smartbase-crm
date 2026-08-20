import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const query = String(q || '').trim().toLowerCase();

    if (!query || query.length < 2) {
      return sendSuccess(res, {
        companies: [],
        tasks: [],
        requests: [],
      });
    }

    const [companies, tasks, requests] = await Promise.all([
      prisma.company.findMany({
        where: {
          isArchived: false,
          OR: [
            { companyName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { currentSoftware: { contains: query } },
            { industry: { contains: query } },
            { description: { contains: query } },
            { contacts: { some: { name: { contains: query } } } },
          ],
        },
        take: 8,
        select: {
          id: true,
          companyName: true,
          status: true,
          industry: true,
          phone: true,
        },
      }),

      prisma.task.findMany({
        where: {
          isArchived: false,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { company: { companyName: { contains: query } } },
          ],
        },
        take: 8,
        include: {
          company: { select: { id: true, companyName: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      }),

      prisma.customerRequest.findMany({
        where: {
          isArchived: false,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { requestedBy: { contains: query } },
            { solution: { contains: query } },
            { company: { companyName: { contains: query } } },
          ],
        },
        take: 8,
        include: {
          company: { select: { id: true, companyName: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      }),
    ]);

    return sendSuccess(res, {
      companies,
      tasks,
      requests,
    });
  } catch (error) {
    console.error('globalSearch error:', error);
    return sendError(res, 'Arama sırasında hata oluştu.', 500);
  }
};
