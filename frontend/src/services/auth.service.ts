import { api } from './api.js';
import { User } from '../types/index.js';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const res = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('smartbase_token', res.data.token);
      localStorage.setItem('smartbase_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get<User>('/auth/me');
    if (res.data) {
      localStorage.setItem('smartbase_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  logout() {
    localStorage.removeItem('smartbase_token');
    localStorage.removeItem('smartbase_user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('smartbase_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('smartbase_token');
  },
};
