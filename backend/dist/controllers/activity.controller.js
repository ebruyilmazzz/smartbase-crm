"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const getActivities = async (req, res) => {
    try {
        const { userId, companyId, taskId, requestId, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (userId)
            where.userId = String(userId);
        if (companyId)
            where.companyId = String(companyId);
        if (taskId)
            where.taskId = String(taskId);
        if (requestId)
            where.requestId = String(requestId);
        const [activities, total] = await Promise.all([
            prisma_js_1.prisma.activity.findMany({
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
            prisma_js_1.prisma.activity.count({ where }),
        ]);
        return (0, response_js_1.sendSuccess)(res, activities, undefined, 200, {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error('getActivities error:', error);
        return (0, response_js_1.sendError)(res, 'Aktiviteler alınamadı.', 500);
    }
};
exports.getActivities = getActivities;
