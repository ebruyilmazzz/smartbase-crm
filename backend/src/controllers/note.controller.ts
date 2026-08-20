import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { logActivity } from '../services/activity.service.js';

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, taskId, requestId } = req.query;

    const where: any = {};
    if (companyId) where.companyId = String(companyId);
    if (taskId) where.taskId = String(taskId);
    if (requestId) where.requestId = String(requestId);

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return sendSuccess(res, notes);
  } catch (error) {
    console.error('getNotes error:', error);
    return sendError(res, 'Notlar alınamadı.', 500);
  }
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { content, companyId, taskId, requestId } = req.body;

    if (!companyId && !taskId && !requestId) {
      return sendError(res, 'Not bir müşteri, iş veya talep ile ilişkilendirilmelidir.', 400);
    }

    const note = await prisma.note.create({
      data: {
        content,
        createdById: req.user!.id,
        companyId: companyId || null,
        taskId: taskId || null,
        requestId: requestId || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Log activity
    let entityDesc = '';
    if (companyId) entityDesc = 'müşteriye';
    else if (taskId) entityDesc = 'işe';
    else if (requestId) entityDesc = 'talebine';

    await logActivity({
      userId: req.user!.id,
      action: 'NOTE_ADDED',
      description: `${req.user!.name}, ilgili ${entityDesc} yeni not ekledi.`,
      companyId: note.companyId || undefined,
      taskId: note.taskId || undefined,
      requestId: note.requestId || undefined,
    });

    return sendSuccess(res, note, 'Not kaydedildi.', 201);
  } catch (error) {
    console.error('createNote error:', error);
    return sendError(res, 'Not oluşturulamadı.', 500);
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Not bulunamadı.', 404);
    }

    if (existing.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return sendError(res, 'Yalnızca kendi eklediğiniz notları düzenleyebilirsiniz.', 403);
    }

    const updated = await prisma.note.update({
      where: { id },
      data: { content },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return sendSuccess(res, updated, 'Not güncellendi.');
  } catch (error) {
    console.error('updateNote error:', error);
    return sendError(res, 'Not güncellenemedi.', 500);
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Not bulunamadı.', 404);
    }

    if (existing.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return sendError(res, 'Yalnızca kendi eklediğiniz notları silebilirsiniz.', 403);
    }

    await prisma.note.delete({ where: { id } });

    return sendSuccess(res, null, 'Not silindi.');
  } catch (error) {
    console.error('deleteNote error:', error);
    return sendError(res, 'Not silinemedi.', 500);
  }
};
