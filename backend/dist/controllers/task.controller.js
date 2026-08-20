"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const activity_service_js_1 = require("../services/activity.service.js");
const getTasks = async (req, res) => {
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
        // Role-based filtering for developers if requested to only see assigned
        // For general CRM transparency developers can view all, but can filter by own tasks easily
        if (search) {
            const searchStr = String(search).toLowerCase();
            where.OR = [
                { title: { contains: searchStr } },
                { description: { contains: searchStr } },
                { company: { companyName: { contains: searchStr } } },
            ];
        }
        const [tasks, total] = await Promise.all([
            prisma_js_1.prisma.task.findMany({
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
            prisma_js_1.prisma.task.count({ where }),
        ]);
        return (0, response_js_1.sendSuccess)(res, tasks, undefined, 200, {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error('getTasks error:', error);
        return (0, response_js_1.sendError)(res, 'İş listesi alınamadı.', 500);
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma_js_1.prisma.task.findUnique({
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
        if (!task) {
            return (0, response_js_1.sendError)(res, 'İş kaydı bulunamadı.', 404);
        }
        return (0, response_js_1.sendSuccess)(res, task);
    }
    catch (error) {
        console.error('getTaskById error:', error);
        return (0, response_js_1.sendError)(res, 'İş detayları alınamadı.', 500);
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res) => {
    try {
        const { title, description, companyId, status = 'Pending', priority = 'Medium', assignedUserId, startDate, dueDate } = req.body;
        const company = await prisma_js_1.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return (0, response_js_1.sendError)(res, 'İlişkili müşteri bulunamadı.', 404);
        }
        const task = await prisma_js_1.prisma.task.create({
            data: {
                title,
                description,
                companyId,
                status,
                priority,
                assignedUserId: assignedUserId || null,
                createdById: req.user.id,
                startDate: startDate ? new Date(startDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
            include: {
                company: { select: { id: true, companyName: true } },
                assignedUser: { select: { id: true, name: true } },
            },
        });
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'TASK_CREATED',
            description: `${req.user.name}, "${company.companyName}" müşterisi için yeni iş oluşturdu: "${task.title}".`,
            companyId: task.companyId,
            taskId: task.id,
        });
        return (0, response_js_1.sendSuccess)(res, task, 'İş başarıyla oluşturuldu.', 201);
    }
    catch (error) {
        console.error('createTask error:', error);
        return (0, response_js_1.sendError)(res, 'İş oluşturulamadı.', 500);
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, assignedUserId, startDate, dueDate, isArchived } = req.body;
        const existing = await prisma_js_1.prisma.task.findUnique({
            where: { id },
            include: { company: true, assignedUser: true },
        });
        if (!existing) {
            return (0, response_js_1.sendError)(res, 'İş kaydı bulunamadı.', 404);
        }
        // Role check: Developers can only update status, notes or their assigned tasks
        if (req.user.role === 'DEVELOPER' && existing.assignedUserId && existing.assignedUserId !== req.user.id) {
            // If developer is updating someone else's task, restrict unless updating just status
            if (title || priority || isArchived !== undefined) {
                return (0, response_js_1.sendError)(res, 'Geliştiriciler yalnızca kendilerine atanan işleri düzenleyebilir.', 403);
            }
        }
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (status !== undefined)
            data.status = status;
        if (priority !== undefined)
            data.priority = priority;
        if (assignedUserId !== undefined)
            data.assignedUserId = assignedUserId || null;
        if (startDate !== undefined)
            data.startDate = startDate ? new Date(startDate) : null;
        if (dueDate !== undefined)
            data.dueDate = dueDate ? new Date(dueDate) : null;
        if (isArchived !== undefined)
            data.isArchived = isArchived;
        const updatedTask = await prisma_js_1.prisma.task.update({
            where: { id },
            data,
            include: {
                company: { select: { id: true, companyName: true } },
                assignedUser: { select: { id: true, name: true, email: true } },
            },
        });
        // Generate descriptive activity log
        let activityDesc = `${req.user.name}, "${updatedTask.title}" başlıklı işi güncelledi.`;
        if (status && status !== existing.status) {
            activityDesc = `${req.user.name}, "${updatedTask.title}" işinin durumunu "${existing.status}" -> "${status}" olarak değiştirdi.`;
        }
        else if (assignedUserId !== undefined && assignedUserId !== existing.assignedUserId) {
            const newAssignee = updatedTask.assignedUser?.name || 'Atanmamış';
            activityDesc = `${req.user.name}, "${updatedTask.title}" işini "${newAssignee}" kullanıcısına atadı.`;
        }
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: status && status !== existing.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
            description: activityDesc,
            companyId: updatedTask.companyId,
            taskId: updatedTask.id,
        });
        return (0, response_js_1.sendSuccess)(res, updatedTask, 'İş kaydı güncellendi.');
    }
    catch (error) {
        console.error('updateTask error:', error);
        return (0, response_js_1.sendError)(res, 'İş güncellenemedi.', 500);
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma_js_1.prisma.task.update({
            where: { id },
            data: { isArchived: true },
            include: { company: true },
        });
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'TASK_ARCHIVED',
            description: `${req.user.name}, "${task.title}" başlıklı işi arşivledi.`,
            companyId: task.companyId,
            taskId: task.id,
        });
        return (0, response_js_1.sendSuccess)(res, task, 'İş arşivlendi.');
    }
    catch (error) {
        console.error('deleteTask error:', error);
        return (0, response_js_1.sendError)(res, 'İş silinemedi/arşivlenemedi.', 500);
    }
};
exports.deleteTask = deleteTask;
