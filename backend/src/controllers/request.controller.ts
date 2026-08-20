import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { logActivity } from '../services/activity.service.js';

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyId,
      status,
      priority,
      assignedUserId,
      search,
      isArchived,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isArchived: isArchived === 'true' ? true : false,
    };

    if (companyId) {
      where.companyId = String(companyId);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (priority && priority !== 'ALL') {
      where.priority = String(priority);
    }

    if (assignedUserId && assignedUserId !== 'ALL') {
      where.assignedUserId = String(assignedUserId);
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
        { requestedBy: { contains: searchStr } },
        { solution: { contains: searchStr } },
        { company: { companyName: { contains: searchStr } } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.customerRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          company: {
            select: { id: true, companyName: true, status: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true, role: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { notes: true, activities: true },
          },
        },
      }),
      prisma.customerRequest.count({ where }),
    ]);

    return sendSuccess(res, requests, undefined, 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('getRequests error:', error);
    return sendError(res, 'Müşteri talepleri alınamadı.', 500);
  }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.customerRequest.findUnique({
      where: { id },
      include: {
        company: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true },
        },
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!request) {
      return sendError(res, 'Talep bulunamadı.', 404);
    }

    return sendSuccess(res, request);
  } catch (error) {
    console.error('getRequestById error:', error);
    return sendError(res, 'Talep detayları alınamadı.', 500);
  }
};

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, companyId, description, requestedBy, priority = 'Medium', status = 'New', assignedUserId, solution } = req.body;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return sendError(res, 'İlişkili müşteri bulunamadı.', 404);
    }

    const customerRequest = await prisma.customerRequest.create({
      data: {
        title,
        description,
        requestedBy,
        companyId,
        priority,
        status,
        assignedUserId: assignedUserId || null,
        solution: solution || null,
        createdById: req.user!.id,
      },
      include: {
        company: { select: { id: true, companyName: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: req.user!.id,
      action: 'REQUEST_CREATED',
      description: `${req.user!.name}, "${company.companyName}" müşterisi için talep açtı: "${customerRequest.title}".`,
      companyId: customerRequest.companyId,
      requestId: customerRequest.id,
    });

    return sendSuccess(res, customerRequest, 'Talep başarıyla kaydedildi.', 201);
  } catch (error) {
    console.error('createRequest error:', error);
    return sendError(res, 'Talep oluşturulamadı.', 500);
  }
};

export const updateRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, requestedBy, priority, status, assignedUserId, solution, isArchived } = req.body;

    const existing = await prisma.customerRequest.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existing) {
      return sendError(res, 'Talep bulunamadı.', 404);
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (requestedBy !== undefined) data.requestedBy = requestedBy;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (assignedUserId !== undefined) data.assignedUserId = assignedUserId || null;
    if (solution !== undefined) data.solution = solution;
    if (isArchived !== undefined) data.isArchived = isArchived;

    const updated = await prisma.customerRequest.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, companyName: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    let activityDesc = `${req.user!.name}, "${updated.title}" talebini güncelledi.`;

    if (status && status !== existing.status) {
      activityDesc = `${req.user!.name}, "${updated.title}" talebinin durumunu "${existing.status}" -> "${status}" olarak güncelledi.`;
    } else if (solution && solution !== existing.solution) {
      activityDesc = `${req.user!.name}, "${updated.title}" talebine çözüm notu ekledi.`;
    }

    await logActivity({
      userId: req.user!.id,
      action: status && status !== existing.status ? 'REQUEST_STATUS_CHANGED' : 'REQUEST_UPDATED',
      description: activityDesc,
      companyId: updated.companyId,
      requestId: updated.id,
    });

    return sendSuccess(res, updated, 'Talep güncellendi.');
  } catch (error) {
    console.error('updateRequest error:', error);
    return sendError(res, 'Talep güncellenemedi.', 500);
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.customerRequest.update({
      where: { id },
      data: { isArchived: true },
      include: { company: true },
    });

    await logActivity({
      userId: req.user!.id,
      action: 'REQUEST_ARCHIVED',
      description: `${req.user!.name}, "${request.title}" talebini arşivledi.`,
      companyId: request.companyId,
      requestId: request.id,
    });

    return sendSuccess(res, request, 'Talep arşivlendi.');
  } catch (error) {
    console.error('deleteRequest error:', error);
    return sendError(res, 'Talep silinemedi.', 500);
  }
};
