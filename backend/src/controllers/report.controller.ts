import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalTasks,
      openTasks,
      completedTasks,
      urgentTasks,
      totalRequests,
      openRequests,
      urgentAndPendingTasks,
      recentRequests,
      recentActivities,
    ] = await Promise.all([
      // Total non-archived companies
      prisma.company.count({ where: { isArchived: false } }),
      // Active companies
      prisma.company.count({ where: { isArchived: false, status: 'Active' } }),
      // Total tasks
      prisma.task.count({ where: { isArchived: false } }),
      // Open tasks (not completed or cancelled)
      prisma.task.count({
        where: {
          isArchived: false,
          status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
        },
      }),
      // Completed tasks
      prisma.task.count({
        where: {
          isArchived: false,
          status: { in: ['Completed', 'Tamamlandı'] },
        },
      }),
      // Urgent tasks
      prisma.task.count({
        where: {
          isArchived: false,
          priority: { in: ['Urgent', 'Acil'] },
          status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
        },
      }),
      // Total requests
      prisma.customerRequest.count({ where: { isArchived: false } }),
      // Open requests
      prisma.customerRequest.count({
        where: {
          isArchived: false,
          status: { notIn: ['Completed', 'Tamamlandı', 'Cancelled', 'İptal'] },
        },
      }),
      // 🔥 Urgent & Pending Tasks (top 6 for dashboard)
      prisma.task.findMany({
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
      prisma.customerRequest.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          company: { select: { id: true, companyName: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      }),
      // 🕘 Recent Activities (top 10 for dashboard)
      prisma.activity.findMany({
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
    const priorityWeight: Record<string, number> = {
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

    return sendSuccess(res, {
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
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return sendError(res, 'Dashboard verileri alınamadı.', 500);
  }
};

export const getReportsData = async (req: AuthRequest, res: Response) => {
  try {
    // Aggregations for charts
    const [tasks, requests, companies] = await Promise.all([
      prisma.task.findMany({
        where: { isArchived: false },
        select: { status: true, priority: true, createdAt: true },
      }),
      prisma.customerRequest.findMany({
        where: { isArchived: false },
        select: { status: true, priority: true, createdAt: true },
      }),
      prisma.company.findMany({
        where: { isArchived: false },
        select: { status: true, industry: true, createdAt: true },
      }),
    ]);

    // Group tasks by status
    const tasksByStatusMap: Record<string, number> = {};
    tasks.forEach((t) => {
      tasksByStatusMap[t.status] = (tasksByStatusMap[t.status] || 0) + 1;
    });
    const tasksByStatus = Object.entries(tasksByStatusMap).map(([name, value]) => ({ name, value }));

    // Group tasks by priority
    const tasksByPriorityMap: Record<string, number> = {};
    tasks.forEach((t) => {
      tasksByPriorityMap[t.priority] = (tasksByPriorityMap[t.priority] || 0) + 1;
    });
    const tasksByPriority = Object.entries(tasksByPriorityMap).map(([name, value]) => ({ name, value }));

    // Group requests by status
    const requestsByStatusMap: Record<string, number> = {};
    requests.forEach((r) => {
      requestsByStatusMap[r.status] = (requestsByStatusMap[r.status] || 0) + 1;
    });
    const requestsByStatus = Object.entries(requestsByStatusMap).map(([name, value]) => ({ name, value }));

    // Group companies by status
    const companiesByStatusMap: Record<string, number> = {};
    companies.forEach((c) => {
      companiesByStatusMap[c.status] = (companiesByStatusMap[c.status] || 0) + 1;
    });
    const companiesByStatus = Object.entries(companiesByStatusMap).map(([name, value]) => ({ name, value }));

    // Group companies by industry
    const companiesByIndustryMap: Record<string, number> = {};
    companies.forEach((c) => {
      const ind = c.industry || 'Diğer';
      companiesByIndustryMap[ind] = (companiesByIndustryMap[ind] || 0) + 1;
    });
    const companiesByIndustry = Object.entries(companiesByIndustryMap).map(([name, value]) => ({ name, value }));

    return sendSuccess(res, {
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
  } catch (error) {
    console.error('getReportsData error:', error);
    return sendError(res, 'Rapor verileri alınamadı.', 500);
  }
};
