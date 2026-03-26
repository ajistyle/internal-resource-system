import { api } from './client';

export function getReleaseRecords(params?: {
  projectId?: number;
  environment?: string;
  versionTag?: string;
  startAt?: string;
  endAt?: string;
  keyword?: string;
}) {
  return api.get('/release-records', { params });
}

