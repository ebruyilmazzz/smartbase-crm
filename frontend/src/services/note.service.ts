import { api } from './api.js';
import { Note } from '../types/index.js';

export const noteService = {
  getNotes(params?: { companyId?: string; taskId?: string; requestId?: string }) {
    return api.get<Note[]>('/notes', params);
  },

  createNote(data: { content: string; companyId?: string; taskId?: string; requestId?: string }) {
    return api.post<Note>('/notes', data);
  },

  updateNote(id: string, content: string) {
    return api.put<Note>(`/notes/${id}`, { content });
  },

  deleteNote(id: string) {
    return api.delete<void>(`/notes/${id}`);
  },
};
