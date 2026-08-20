"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotes = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const activity_service_js_1 = require("../services/activity.service.js");
const getNotes = async (req, res) => {
    try {
        const { companyId, taskId, requestId } = req.query;
        const where = {};
        if (companyId)
            where.companyId = String(companyId);
        if (taskId)
            where.taskId = String(taskId);
        if (requestId)
            where.requestId = String(requestId);
        const notes = await prisma_js_1.prisma.note.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });
        return (0, response_js_1.sendSuccess)(res, notes);
    }
    catch (error) {
        console.error('getNotes error:', error);
        return (0, response_js_1.sendError)(res, 'Notlar alınamadı.', 500);
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res) => {
    try {
        const { content, companyId, taskId, requestId } = req.body;
        if (!companyId && !taskId && !requestId) {
            return (0, response_js_1.sendError)(res, 'Not bir müşteri, iş veya talep ile ilişkilendirilmelidir.', 400);
        }
        const note = await prisma_js_1.prisma.note.create({
            data: {
                content,
                createdById: req.user.id,
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
        if (companyId)
            entityDesc = 'müşteriye';
        else if (taskId)
            entityDesc = 'işe';
        else if (requestId)
            entityDesc = 'talebine';
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'NOTE_ADDED',
            description: `${req.user.name}, ilgili ${entityDesc} yeni not ekledi.`,
            companyId: note.companyId || undefined,
            taskId: note.taskId || undefined,
            requestId: note.requestId || undefined,
        });
        return (0, response_js_1.sendSuccess)(res, note, 'Not kaydedildi.', 201);
    }
    catch (error) {
        console.error('createNote error:', error);
        return (0, response_js_1.sendError)(res, 'Not oluşturulamadı.', 500);
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const existing = await prisma_js_1.prisma.note.findUnique({ where: { id } });
        if (!existing) {
            return (0, response_js_1.sendError)(res, 'Not bulunamadı.', 404);
        }
        if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
            return (0, response_js_1.sendError)(res, 'Yalnızca kendi eklediğiniz notları düzenleyebilirsiniz.', 403);
        }
        const updated = await prisma_js_1.prisma.note.update({
            where: { id },
            data: { content },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Not güncellendi.');
    }
    catch (error) {
        console.error('updateNote error:', error);
        return (0, response_js_1.sendError)(res, 'Not güncellenemedi.', 500);
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma_js_1.prisma.note.findUnique({ where: { id } });
        if (!existing) {
            return (0, response_js_1.sendError)(res, 'Not bulunamadı.', 404);
        }
        if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
            return (0, response_js_1.sendError)(res, 'Yalnızca kendi eklediğiniz notları silebilirsiniz.', 403);
        }
        await prisma_js_1.prisma.note.delete({ where: { id } });
        return (0, response_js_1.sendSuccess)(res, null, 'Not silindi.');
    }
    catch (error) {
        console.error('deleteNote error:', error);
        return (0, response_js_1.sendError)(res, 'Not silinemedi.', 500);
    }
};
exports.deleteNote = deleteNote;
