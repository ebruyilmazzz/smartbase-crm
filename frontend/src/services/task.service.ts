import { api } from './api.js';
import { Task } from '../types/index.js';

export const taskService = {
  getTasks(params?: {
    companyId?: string;
    status?: string;
    priority?: string;
    assignedUserId?: string;
    search?: string;
    isArchived?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return api.get<Task[]>('/tasks', params);
  },

  getTask(id: string) {
    return api.get<Task>(`/tasks/${id}`);
  },

  createTask(data: any) {
    return api.post<Task>('/tasks', data);
  },

  updateTask(id: string, data: any) {
    return api.put<Task>(`/tasks/${id}`, data);
  },

  deleteTask(id: string) {
    return api.delete<Task>(`/tasks/${id}`);
  },
};
