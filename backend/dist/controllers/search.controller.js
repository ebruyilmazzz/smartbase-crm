"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const response_js_1 = require("../utils/response.js");
const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        const query = String(q || '').trim().toLowerCase();
        if (!query || query.length < 2) {
            return (0, response_js_1.sendSuccess)(res, {
                companies: [],
                tasks: [],
                requests: [],
            });
        }
        const [companies, tasks, requests] = await Promise.all([
            prisma_js_1.prisma.company.findMany({
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
            prisma_js_1.prisma.task.findMany({
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
            prisma_js_1.prisma.customerRequest.findMany({
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
        return (0, response_js_1.sendSuccess)(res, {
            companies,
            tasks,
            requests,
        });
    }
    catch (error) {
        console.error('globalSearch error:', error);
        return (0, response_js_1.sendError)(res, 'Arama sırasında hata oluştu.', 500);
    }
};
exports.globalSearch = globalSearch;
