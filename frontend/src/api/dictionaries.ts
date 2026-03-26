import { api } from './client';

export function getDictionaries(params?: { type?: string; code?: string; name?: string; parentCode?: string; status?: number }) {
  return api.get('/dictionaries', { params: params ?? {} });
}

export function getDictionary(id: number) {
  return api.get(`/dictionaries/${id}`);
}

export function createDictionary(data: Record<string, unknown>) {
  return api.post('/dictionaries', data);
}

export function updateDictionary(id: number, data: Record<string, unknown>) {
  return api.patch(`/dictionaries/${id}`, data);
}

export function deleteDictionary(id: number) {
  return api.delete(`/dictionaries/${id}`);
}
