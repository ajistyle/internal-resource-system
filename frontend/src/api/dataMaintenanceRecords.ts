import { api } from './client';

export function getDataMaintenanceRecords(params?: { projectId?: number; databaseId?: number }) {
  return api.get('/data-maintenance-records', { params: params ?? {} });
}

export function createDataMaintenanceRecord(data: Record<string, unknown>) {
  return api.post('/data-maintenance-records', data);
}

export function updateDataMaintenanceRecord(id: number, data: Record<string, unknown>) {
  return api.patch(`/data-maintenance-records/${id}`, data);
}

export function deleteDataMaintenanceRecord(id: number) {
  return api.delete(`/data-maintenance-records/${id}`);
}

