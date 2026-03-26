import { api } from './client';

export function getRolesOptions() {
  return api.get('/roles/options');
}

export function getUsers() {
  return api.get('/users');
}

export function getUser(id: number) {
  return api.get(`/users/${id}`);
}

export function createUser(data: Record<string, unknown>) {
  return api.post('/users', data);
}

export function updateUser(id: number, data: Record<string, unknown>) {
  return api.patch(`/users/${id}`, data);
}

export function deleteUser(id: number) {
  return api.delete(`/users/${id}`);
}
