import { api } from './client';

export function getRemoteInfos(projectId?: number) {
  return api.get('/remote-infos', { params: projectId != null ? { projectId } : {} });
}

export function getRemoteInfo(id: number) {
  return api.get(`/remote-infos/${id}`);
}

export function createRemoteInfo(data: Record<string, unknown>) {
  return api.post('/remote-infos', data);
}

export function updateRemoteInfo(id: number, data: Record<string, unknown>) {
  return api.patch(`/remote-infos/${id}`, data);
}

export function deleteRemoteInfo(id: number) {
  return api.delete(`/remote-infos/${id}`);
}
