import { api } from './api.js';
import { Activity } from '../types/index.js';

export const activityService = {
  getActivities(params?: {
    userId?: string;
    companyId?: string;
    taskId?: string;
    requestId?: string;
    page?: number;
    limit?: number;
  }) {
    return api.get<Activity[]>('/activities', params);
  },
};
