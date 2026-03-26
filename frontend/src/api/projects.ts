import { api } from './client';

export function getProjects(params?: { province?: string; city?: string; projectLeader?: string; name?: string }) {
  return api.get('/projects', { params });
}

export function getProject(id: number, detail = true) {
  return api.get(`/projects/${id}`, { params: detail ? { detail: '1' } : {} });
}

export function createProject(data: Record<string, unknown>) {
  return api.post('/projects', data);
}

export function updateProject(id: number, data: Record<string, unknown>) {
  return api.patch(`/projects/${id}`, data);
}

export function deleteProject(id: number) {
  return api.delete(`/projects/${id}`);
}
