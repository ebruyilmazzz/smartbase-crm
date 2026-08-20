import { api } from './api.js';
import { Task, CustomerRequest, Activity } from '../types/index.js';

export interface DashboardData {
  summary: {
    totalCompanies: number;
    activeCompanies: number;
    totalTasks: number;
    openTasks: number;
    completedTasks: number;
    urgentTasks: number;
    totalRequests: number;
    openRequests: number;
  };
  urgentAndPendingTasks: Task[];
  recentRequests: CustomerRequest[];
  recentActivities: Activity[];
}

export interface ReportsData {
  totalCompanies: number;
  activeCompanies: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalRequests: number;
  openRequests: number;
  charts: {
    tasksByStatus: { name: string; value: number }[];
    tasksByPriority: { name: string; value: number }[];
    requestsByStatus: { name: string; value: number }[];
    companiesByStatus: { name: string; value: number }[];
    companiesByIndustry: { name: string; value: number }[];
  };
}

export const reportService = {
  getDashboard() {
    return api.get<DashboardData>('/reports/dashboard');
  },

  getAnalytics() {
    return api.get<ReportsData>('/reports/analytics');
  },
};
