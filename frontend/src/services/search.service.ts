import { api } from './api.js';
import { Company, Task, CustomerRequest } from '../types/index.js';

export interface SearchResults {
  companies: Company[];
  tasks: Task[];
  requests: CustomerRequest[];
}

export const searchService = {
  search(query: string) {
    return api.get<SearchResults>('/search', { q: query });
  },
};
