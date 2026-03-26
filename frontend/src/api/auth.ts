import { api } from './client';

export interface LoginRes {
  access_token: string;
  user: { id: number; username: string; realName: string | null; roles: string[] };
}

export function login(username: string, password: string) {
  return api.post<LoginRes>('/auth/login', { username, password });
}

export function me() {
  return api.get('/auth/me');
}
