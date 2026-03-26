import { api } from './client';

export function getOverviewStats() {
  return api.get('/stats/overview');
}

