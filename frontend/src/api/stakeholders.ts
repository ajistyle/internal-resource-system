import { api } from './client';

export function getStakeholders(params?: { projectId?: number; name?: string }) {
  return api.get('/stakeholders', { params: params ?? {} });
}

export function getStakeholder(id: number) {
  return api.get(`/stakeholders/${id}`);
}

export function createStakeholder(data: Record<string, unknown>) {
  return api.post('/stakeholders', data);
}

export function updateStakeholder(id: number, data: Record<string, unknown>) {
  return api.patch(`/stakeholders/${id}`, data);
}

export function deleteStakeholder(id: number) {
  return api.delete(`/stakeholders/${id}`);
}
