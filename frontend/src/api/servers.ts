import { api } from './client';

export function getServers(projectId?: number) {
  return api.get('/servers', { params: projectId != null ? { projectId } : {} });
}

export function getServer(id: number) {
  return api.get(`/servers/${id}`);
}

export function createServer(data: Record<string, unknown>) {
  return api.post('/servers', data);
}

export function updateServer(id: number, data: Record<string, unknown>) {
  return api.patch(`/servers/${id}`, data);
}

export function deleteServer(id: number) {
  return api.delete(`/servers/${id}`);
}
