import { api } from './client';

export function getDeployItems(params?: { enabled?: number; softwareType?: string; name?: string }) {
  return api.get('/deploy-items', { params: params ?? {} });
}

export function getDeployItem(id: number) {
  return api.get(`/deploy-items/${id}`);
}

export function createDeployItem(data: Record<string, unknown>) {
  return api.post('/deploy-items', data);
}

export function updateDeployItem(id: number, data: Record<string, unknown>) {
  return api.patch(`/deploy-items/${id}`, data);
}

export function deleteDeployItem(id: number) {
  return api.delete(`/deploy-items/${id}`);
}
