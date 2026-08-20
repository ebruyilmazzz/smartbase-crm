import { api } from './api.js';
import { User, CustomStatus, CustomPriority } from '../types/index.js';

export const settingsService = {
  // Users
  getUsers() {
    return api.get<User[]>('/settings/users');
  },

  createUser(data: any) {
    return api.post<User>('/settings/users', data);
  },

  updateUser(id: string, data: any) {
    return api.put<User>(`/settings/users/${id}`, data);
  },

  // Statuses
  getStatuses(category?: 'COMPANY' | 'TASK' | 'REQUEST') {
    return api.get<CustomStatus[]>('/settings/statuses', { category });
  },

  createStatus(data: Partial<CustomStatus>) {
    return api.post<CustomStatus>('/settings/statuses', data);
  },

  updateStatus(id: string, data: Partial<CustomStatus>) {
    return api.put<CustomStatus>(`/settings/statuses/${id}`, data);
  },

  // Priorities
  getPriorities() {
    return api.get<CustomPriority[]>('/settings/priorities');
  },

  createPriority(data: Partial<CustomPriority>) {
    return api.post<CustomPriority>('/settings/priorities', data);
  },

  updatePriority(id: string, data: Partial<CustomPriority>) {
    return api.put<CustomPriority>(`/settings/priorities/${id}`, data);
  },
};
