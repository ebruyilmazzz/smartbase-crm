"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportsData = exports.getDashboardStats = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const getDashboardStats = async (req, res) => {
    try {
        const [totalCompanies, activeCompanies, totalTasks, openTasks, completedTasks, urgentTasks, totalRequests, openRequests, urgentAndPendingTasks, recentRequests, recentActivities,] = await Promise.all([
            // Total non-archived companies
            prisma_js_1.prisma.company.count({ where: { isArchived: false } }),
            // Active companies
            prisma_js_1.prisma.company.count({ where: { isArchived: false, status: 'Active' } }),
            // Total tasks
            prisma_js_1.prisma.task.count({ where: { isArchived: false } }),
            // Open tasks (not completed or cancelled)
            prisma_js_1.prisma.task.count({
                where: {
                    isArchived: false,
                    status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
                },
            }),
            // Completed tasks
            prisma_js_1.prisma.task.count({
                where: {
                    isArchived: false,
                    status: { in: ['Completed', 'Tamamlandı'] },
                },
            }),
            // Urgent tasks
            prisma_js_1.prisma.task.count({
                where: {
                    isArchived: false,
                    priority: { in: ['Urgent', 'Acil'] },
                    status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
                },
            }),
            // Total requests
            prisma_js_1.prisma.customerRequest.count({ where: { isArchived: false } }),
            // Open requests
            prisma_js_1.prisma.customerRequest.count({
                where: {
                    isArchived: false,
                    status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
                },
            }),
            // 🔥 Urgent & Pending Tasks (top 6 for dashboard)
            prisma_js_1.prisma.task.findMany({
                where: {
                    isArchived: false,
                    status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
                },
                orderBy: [
                    { priority: 'asc' }, // Urgent will be top if sorted or we sort manually
                    { dueDate: 'asc' },
                    { createdAt: 'desc' },
                ],
                take: 8,
                include: {
                    company: { select: { id: true, companyName: true } },
                    assignedUser: { select: { id: true, name: true, email: true } },
                },
            }),
            // 💬 Recent Customer Requests (top 6 for dashboard)
            prisma_js_1.prisma.customerRequest.findMany({
                where: { isArchived: false },
                orderBy: { createdAt: 'desc' },
                take: 6,
                include: {
                    company: { select: { id: true, companyName: true } },
                    assignedUser: { select: { id: true, name: true } },
                },
            }),
            // 🕘 Recent Activities (top 10 for dashboard)
            prisma_js_1.prisma.activity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { id: true, name: true, role: true } },
                    company: { select: { id: true, companyName: true } },
                    task: { select: { id: true, title: true } },
                    request: { select: { id: true, title: true } },
                },
            }),
        ]);
        // Custom sort urgent first
        const priorityWeight = {
            Urgent: 1,
            Acil: 1,
            High: 2,
            Yüksek: 2,
            Medium: 3,
            Orta: 3,
            Low: 4,
            Düşük: 4,
        };
        const sortedUrgentTasks = [...urgentAndPendingTasks].sort((a, b) => {
            const weightA = priorityWeight[a.priority] || 99;
            const weightB = priorityWeight[b.priority] || 99;
            return weightA - weightB;
        });
        return (0, response_js_1.sendSuccess)(res, {
            summary: {
                totalCompanies,
                activeCompanies,
                totalTasks,
                openTasks,
                completedTasks,
                urgentTasks,
                totalRequests,
                openRequests,
            },
            urgentAndPendingTasks: sortedUrgentTasks,
            recentRequests,
            recentActivities,
        });
    }
    catch (error) {
        console.error('getDashboardStats error:', error);
        return (0, response_js_1.sendError)(res, 'Dashboard verileri alınamadı.', 500);
    }
};
exports.getDashboardStats = getDashboardStats;
const getReportsData = async (req, res) => {
    try {
        // Aggregations for charts
        const [tasks, requests, companies] = await Promise.all([
            prisma_js_1.prisma.task.findMany({
                where: { isArchived: false },
                select: { status: true, priority: true, createdAt: true },
            }),
            prisma_js_1.prisma.customerRequest.findMany({
                where: { isArchived: false },
                select: { status: true, priority: true, createdAt: true },
            }),
            prisma_js_1.prisma.company.findMany({
                where: { isArchived: false },
                select: { status: true, industry: true, createdAt: true },
            }),
        ]);
        // Group tasks by status
        const tasksByStatusMap = {};
        tasks.forEach((t) => {
            tasksByStatusMap[t.status] = (tasksByStatusMap[t.status] || 0) + 1;
        });
        const tasksByStatus = Object.entries(tasksByStatusMap).map(([name, value]) => ({ name, value }));
        // Group tasks by priority
        const tasksByPriorityMap = {};
        tasks.forEach((t) => {
            tasksByPriorityMap[t.priority] = (tasksByPriorityMap[t.priority] || 0) + 1;
        });
        const tasksByPriority = Object.entries(tasksByPriorityMap).map(([name, value]) => ({ name, value }));
        // Group requests by status
        const requestsByStatusMap = {};
        requests.forEach((r) => {
            requestsByStatusMap[r.status] = (requestsByStatusMap[r.status] || 0) + 1;
        });
        const requestsByStatus = Object.entries(requestsByStatusMap).map(([name, value]) => ({ name, value }));
        // Group companies by status
        const companiesByStatusMap = {};
        companies.forEach((c) => {
            companiesByStatusMap[c.status] = (companiesByStatusMap[c.status] || 0) + 1;
        });
        const companiesByStatus = Object.entries(companiesByStatusMap).map(([name, value]) => ({ name, value }));
        // Group companies by industry
        const companiesByIndustryMap = {};
        companies.forEach((c) => {
            const ind = c.industry || 'Diğer';
            companiesByIndustryMap[ind] = (companiesByIndustryMap[ind] || 0) + 1;
        });
        const companiesByIndustry = Object.entries(companiesByIndustryMap).map(([name, value]) => ({ name, value }));
        return (0, response_js_1.sendSuccess)(res, {
            totalCompanies: companies.length,
            activeCompanies: companies.filter(c => c.status === 'Active' || c.status === 'Aktif').length,
            totalTasks: tasks.length,
            openTasks: tasks.filter(t => !['Completed', 'Tamamlandı', 'Cancelled', 'İptal'].includes(t.status)).length,
            completedTasks: tasks.filter(t => ['Completed', 'Tamamlandı'].includes(t.status)).length,
            totalRequests: requests.length,
            openRequests: requests.filter(r => !['Completed', 'Tamamlandı', 'Cancelled', 'İptal'].includes(r.status)).length,
            charts: {
                tasksByStatus,
                tasksByPriority,
                requestsByStatus,
                companiesByStatus,
                companiesByIndustry,
            },
        });
    }
    catch (error) {
        console.error('getReportsData error:', error);
        return (0, response_js_1.sendError)(res, 'Rapor verileri alınamadı.', 500);
    }
};
exports.getReportsData = getReportsData;
