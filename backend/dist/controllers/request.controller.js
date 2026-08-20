"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRequest = exports.updateRequest = exports.createRequest = exports.getRequestById = exports.getRequests = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const activity_service_js_1 = require("../services/activity.service.js");
const getRequests = async (req, res) => {
    try {
        const { companyId, status, priority, assignedUserId, search, isArchived, page = '1', limit = '50', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {
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
            prisma_js_1.prisma.customerRequest.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: {
                    [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
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
            prisma_js_1.prisma.customerRequest.count({ where }),
        ]);
        return (0, response_js_1.sendSuccess)(res, requests, undefined, 200, {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error('getRequests error:', error);
        return (0, response_js_1.sendError)(res, 'Müşteri talepleri alınamadı.', 500);
    }
};
exports.getRequests = getRequests;
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await prisma_js_1.prisma.customerRequest.findUnique({
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
            return (0, response_js_1.sendError)(res, 'Talep bulunamadı.', 404);
        }
        return (0, response_js_1.sendSuccess)(res, request);
    }
    catch (error) {
        console.error('getRequestById error:', error);
        return (0, response_js_1.sendError)(res, 'Talep detayları alınamadı.', 500);
    }
};
exports.getRequestById = getRequestById;
const createRequest = async (req, res) => {
    try {
        const { title, companyId, description, requestedBy, priority = 'Medium', status = 'New', assignedUserId, solution } = req.body;
        const company = await prisma_js_1.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return (0, response_js_1.sendError)(res, 'İlişkili müşteri bulunamadı.', 404);
        }
        const customerRequest = await prisma_js_1.prisma.customerRequest.create({
            data: {
                title,
                description,
                requestedBy,
                companyId,
                priority,
                status,
                assignedUserId: assignedUserId || null,
                solution: solution || null,
                createdById: req.user.id,
            },
            include: {
                company: { select: { id: true, companyName: true } },
                assignedUser: { select: { id: true, name: true } },
            },
        });
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'REQUEST_CREATED',
            description: `${req.user.name}, "${company.companyName}" müşterisi için talep açtı: "${customerRequest.title}".`,
            companyId: customerRequest.companyId,
            requestId: customerRequest.id,
        });
        return (0, response_js_1.sendSuccess)(res, customerRequest, 'Talep başarıyla kaydedildi.', 201);
    }
    catch (error) {
        console.error('createRequest error:', error);
        return (0, response_js_1.sendError)(res, 'Talep oluşturulamadı.', 500);
    }
};
exports.createRequest = createRequest;
const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, requestedBy, priority, status, assignedUserId, solution, isArchived } = req.body;
        const existing = await prisma_js_1.prisma.customerRequest.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!existing) {
            return (0, response_js_1.sendError)(res, 'Talep bulunamadı.', 404);
        }
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (requestedBy !== undefined)
            data.requestedBy = requestedBy;
        if (priority !== undefined)
            data.priority = priority;
        if (status !== undefined)
            data.status = status;
        if (assignedUserId !== undefined)
            data.assignedUserId = assignedUserId || null;
        if (solution !== undefined)
            data.solution = solution;
        if (isArchived !== undefined)
            data.isArchived = isArchived;
        const updated = await prisma_js_1.prisma.customerRequest.update({
            where: { id },
            data,
            include: {
                company: { select: { id: true, companyName: true } },
                assignedUser: { select: { id: true, name: true, email: true } },
            },
        });
        let activityDesc = `${req.user.name}, "${updated.title}" talebini güncelledi.`;
        if (status && status !== existing.status) {
            activityDesc = `${req.user.name}, "${updated.title}" talebinin durumunu "${existing.status}" -> "${status}" olarak güncelledi.`;
        }
        else if (solution && solution !== existing.solution) {
            activityDesc = `${req.user.name}, "${updated.title}" talebine çözüm notu ekledi.`;
        }
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: status && status !== existing.status ? 'REQUEST_STATUS_CHANGED' : 'REQUEST_UPDATED',
            description: activityDesc,
            companyId: updated.companyId,
            requestId: updated.id,
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Talep güncellendi.');
    }
    catch (error) {
        console.error('updateRequest error:', error);
        return (0, response_js_1.sendError)(res, 'Talep güncellenemedi.', 500);
    }
};
exports.updateRequest = updateRequest;
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await prisma_js_1.prisma.customerRequest.update({
            where: { id },
            data: { isArchived: true },
            include: { company: true },
        });
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'REQUEST_ARCHIVED',
            description: `${req.user.name}, "${request.title}" talebini arşivledi.`,
            companyId: request.companyId,
            requestId: request.id,
        });
        return (0, response_js_1.sendSuccess)(res, request, 'Talep arşivlendi.');
    }
    catch (error) {
        console.error('deleteRequest error:', error);
        return (0, response_js_1.sendError)(res, 'Talep silinemedi.', 500);
    }
};
exports.deleteRequest = deleteRequest;
