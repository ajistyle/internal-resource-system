import { api } from './client';

export function getNetworkPolicies(params?: {
  projectId?: number;
  serverId?: number;
  policyType?: string;
  status?: string;
  protocol?: string;
  keyword?: string;
  localIp?: string;
  peerIp?: string;
}) {
  return api.get('/network-policies', { params: params ?? {} });
}

export function createNetworkPolicy(data: Record<string, unknown>) {
  return api.post('/network-policies', data);
}

export function updateNetworkPolicy(id: number, data: Record<string, unknown>) {
  return api.patch(`/network-policies/${id}`, data);
}

export function deleteNetworkPolicy(id: number) {
  return api.delete(`/network-policies/${id}`);
}

