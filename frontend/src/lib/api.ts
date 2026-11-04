import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  // Let the browser set the boundary automatically for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh the session
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth - these are now handled by Supabase directly in AuthContext
// but keep the API endpoints for backward compatibility
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Meetings
export const meetingsApi = {
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get('/meetings', { params }),
  get: (id: number) => api.get(`/meetings/${id}`),
  create: (data: any) => api.post('/meetings', data),
  update: (id: number, data: any) => api.put(`/meetings/${id}`, data),
  delete: (id: number) => api.delete(`/meetings/${id}`),
  reanalyze: (id: number) => api.post(`/meetings/${id}/reanalyze`),
};

// AI
export const aiApi = {
  analyze: (data: { meeting_id: number; notes: string }) =>
    api.post('/ai/analyze', data),
  analyzeFile: (meetingId: number, file: File) => {
    const formData = new FormData();
    formData.append('meeting_id', meetingId.toString());
    formData.append('file', file);
    return api.post('/ai/analyze-file', formData);
  },
};

// Tasks
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

// Knowledge Base
export const knowledgeApi = {
  list: () => api.get('/knowledge'),
  upload: (formData: FormData) => api.post('/knowledge/upload', formData),
  search: (query: string) => api.post('/knowledge/search', { query }),
  delete: (id: number) => api.delete(`/knowledge/${id}`),
};

// Analytics
export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  tasks: () => api.get('/analytics/tasks'),
};

export default api;
