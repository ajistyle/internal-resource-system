import { api } from './client';

export function getDatabases(projectId?: number) {
  return api.get('/databases', { params: projectId != null ? { projectId } : {} });
}

export function getDatabase(id: number) {
  return api.get(`/databases/${id}`);
}

