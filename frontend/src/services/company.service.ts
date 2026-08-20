import { api } from './api.js';
import { Company, CompanyContact } from '../types/index.js';

export const companyService = {
  getCompanies(params?: {
    search?: string;
    status?: string;
    industry?: string;
    isArchived?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return api.get<Company[]>('/companies', params);
  },

  getCompany(id: string) {
    return api.get<Company>(`/companies/${id}`);
  },

  createCompany(data: any) {
    return api.post<Company>('/companies', data);
  },

  updateCompany(id: string, data: any) {
    return api.put<Company>(`/companies/${id}`, data);
  },

  archiveCompany(id: string, isArchived = true) {
    return api.delete<Company>(`/companies/${id}`, { isArchived });
  },

  addContact(companyId: string, contact: Partial<CompanyContact>) {
    return api.post<CompanyContact>(`/companies/${companyId}/contacts`, contact);
  },

  updateContact(contactId: string, contact: Partial<CompanyContact>) {
    return api.put<CompanyContact>(`/companies/contacts/${contactId}`, contact);
  },

  deleteContact(contactId: string) {
    return api.delete<void>(`/companies/contacts/${contactId}`);
  },
};
