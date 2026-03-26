import { api } from './client';

export function getAssetsOverview(projectId?: number) {
  return api.get('/assets/overview', { params: projectId != null ? { projectId } : {} });
}

export function getAssetDetail(type: 'server' | 'data-backup', id: number) {
  return api.get(`/assets/${type}/${id}/detail`);
}

