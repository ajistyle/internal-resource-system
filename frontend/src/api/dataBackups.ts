import { api } from './client';

export function getDataBackups(params?: {
  projectId?: number;
  serverId?: number;
  backupType?: string;
  backupPolicy?: string;
}) {
  return api.get('/data-backups', { params: params ?? {} });
}

export function getDataBackup(id: number) {
  return api.get(`/data-backups/${id}`);
}

export function createDataBackup(data: Record<string, unknown>) {
  return api.post('/data-backups', data);
}

export function updateDataBackup(id: number, data: Record<string, unknown>) {
  return api.patch(`/data-backups/${id}`, data);
}

export function deleteDataBackup(id: number) {
  return api.delete(`/data-backups/${id}`);
}

