import { api } from './client';

export function getServerMaintenanceRecords(params?: { projectId?: number; serverId?: number }) {
  return api.get('/server-maintenance-records', { params: params ?? {} });
}

export function createServerMaintenanceRecord(data: Record<string, unknown>) {
  return api.post('/server-maintenance-records', data);
}

export function updateServerMaintenanceRecord(id: number, data: Record<string, unknown>) {
  return api.patch(`/server-maintenance-records/${id}`, data);
}

export function deleteServerMaintenanceRecord(id: number) {
  return api.delete(`/server-maintenance-records/${id}`);
}

