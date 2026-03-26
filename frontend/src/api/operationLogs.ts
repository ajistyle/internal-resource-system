import { api } from './client';

export function getOperationLogs(params?: {
  startTime?: string;
  endTime?: string;
  type?: string;
  target?: string;
  message?: string;
}) {
  return api.get('/operation-logs', { params: params ?? {} });
}

