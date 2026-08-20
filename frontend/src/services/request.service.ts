import { api } from './api.js';
import { CustomerRequest } from '../types/index.js';

export const requestService = {
  getRequests(params?: {
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
    return api.get<CustomerRequest[]>('/requests', params);
  },

  getRequest(id: string) {
    return api.get<CustomerRequest>(`/requests/${id}`);
  },

  createRequest(data: any) {
    return api.post<CustomerRequest>('/requests', data);
  },

  updateRequest(id: string, data: any) {
    return api.put<CustomerRequest>(`/requests/${id}`, data);
  },

  deleteRequest(id: string) {
    return api.delete<CustomerRequest>(`/requests/${id}`);
  },
};
