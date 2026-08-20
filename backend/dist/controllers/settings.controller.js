"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePriority = exports.createPriority = exports.getPriorities = exports.updateStatus = exports.createStatus = exports.getStatuses = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const activity_service_js_1 = require("../services/activity.service.js");
// User Management (Admin only)
const getUsers = async (req, res) => {
    try {
        const users = await prisma_js_1.prisma.user.findMany({
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
        return (0, response_js_1.sendSuccess)(res, users);
    }
    catch (error) {
        console.error('getUsers error:', error);
        return (0, response_js_1.sendError)(res, 'Kullanıcılar alınamadı.', 500);
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, status = 'ACTIVE' } = req.body;
        const existing = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existing) {
            return (0, response_js_1.sendError)(res, 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_js_1.prisma.user.create({
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
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'USER_CREATED',
            description: `${req.user.name}, "${user.name}" (${user.email} - ${user.role}) adlı kullanıcıyı sisteme ekledi.`,
        });
        return (0, response_js_1.sendSuccess)(res, user, 'Kullanıcı başarıyla oluşturuldu.', 201);
    }
    catch (error) {
        console.error('createUser error:', error);
        return (0, response_js_1.sendError)(res, 'Kullanıcı oluşturulamadı.', 500);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, status } = req.body;
        const existing = await prisma_js_1.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return (0, response_js_1.sendError)(res, 'Kullanıcı bulunamadı.', 404);
        }
        const data = {};
        if (name)
            data.name = name;
        if (email)
            data.email = email.toLowerCase().trim();
        if (role)
            data.role = role;
        if (status)
            data.status = status;
        if (password) {
            data.password = await bcryptjs_1.default.hash(password, 10);
        }
        const updated = await prisma_js_1.prisma.user.update({
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
        await (0, activity_service_js_1.logActivity)({
            userId: req.user.id,
            action: 'USER_UPDATED',
            description: `${req.user.name}, "${updated.name}" kullanıcısının profil/yetki bilgilerini güncelledi.`,
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Kullanıcı güncellendi.');
    }
    catch (error) {
        console.error('updateUser error:', error);
        return (0, response_js_1.sendError)(res, 'Kullanıcı güncellenemedi.', 500);
    }
};
exports.updateUser = updateUser;
// Status Management
const getStatuses = async (req, res) => {
    try {
        const { category } = req.query;
        const where = {};
        if (category)
            where.category = String(category);
        const statuses = await prisma_js_1.prisma.customStatus.findMany({
            where,
            orderBy: { order: 'asc' },
        });
        return (0, response_js_1.sendSuccess)(res, statuses);
    }
    catch (error) {
        console.error('getStatuses error:', error);
        return (0, response_js_1.sendError)(res, 'Durumlar alınamadı.', 500);
    }
};
exports.getStatuses = getStatuses;
const createStatus = async (req, res) => {
    try {
        const { name, category, color, order = 0 } = req.body;
        const status = await prisma_js_1.prisma.customStatus.create({
            data: { name, category, color, order: Number(order) },
        });
        return (0, response_js_1.sendSuccess)(res, status, 'Durum eklendi.', 201);
    }
    catch (error) {
        console.error('createStatus error:', error);
        return (0, response_js_1.sendError)(res, 'Durum eklenemedi.', 500);
    }
};
exports.createStatus = createStatus;
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, order, isActive } = req.body;
        const updated = await prisma_js_1.prisma.customStatus.update({
            where: { id },
            data: { name, color, order: order !== undefined ? Number(order) : undefined, isActive },
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Durum güncellendi.');
    }
    catch (error) {
        console.error('updateStatus error:', error);
        return (0, response_js_1.sendError)(res, 'Durum güncellenemedi.', 500);
    }
};
exports.updateStatus = updateStatus;
// Priority Management
const getPriorities = async (req, res) => {
    try {
        const priorities = await prisma_js_1.prisma.customPriority.findMany({
            orderBy: { order: 'asc' },
        });
        return (0, response_js_1.sendSuccess)(res, priorities);
    }
    catch (error) {
        console.error('getPriorities error:', error);
        return (0, response_js_1.sendError)(res, 'Öncelikler alınamadı.', 500);
    }
};
exports.getPriorities = getPriorities;
const createPriority = async (req, res) => {
    try {
        const { name, color, order = 0 } = req.body;
        const priority = await prisma_js_1.prisma.customPriority.create({
            data: { name, color, order: Number(order) },
        });
        return (0, response_js_1.sendSuccess)(res, priority, 'Öncelik eklendi.', 201);
    }
    catch (error) {
        console.error('createPriority error:', error);
        return (0, response_js_1.sendError)(res, 'Öncelik eklenemedi.', 500);
    }
};
exports.createPriority = createPriority;
const updatePriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, order, isActive } = req.body;
        const updated = await prisma_js_1.prisma.customPriority.update({
            where: { id },
            data: { name, color, order: order !== undefined ? Number(order) : undefined, isActive },
        });
        return (0, response_js_1.sendSuccess)(res, updated, 'Öncelik güncellendi.');
    }
    catch (error) {
        console.error('updatePriority error:', error);
        return (0, response_js_1.sendError)(res, 'Öncelik güncellenemedi.', 500);
    }
};
exports.updatePriority = updatePriority;
