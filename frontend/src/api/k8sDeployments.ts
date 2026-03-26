import { api } from './client';

export function getK8sDeployments(params?: { projectId?: number; clusterEnv?: string; status?: string; keyword?: string }) {
  return api.get('/k8s-deployments', { params: params ?? {} });
}

export function getK8sDeployment(id: number) {
  return api.get(`/k8s-deployments/${id}`);
}

export function createK8sDeployment(data: Record<string, unknown>) {
  return api.post('/k8s-deployments', data);
}

export function updateK8sDeployment(id: number, data: Record<string, unknown>) {
  return api.patch(`/k8s-deployments/${id}`, data);
}

export function deleteK8sDeployment(id: number) {
  return api.delete(`/k8s-deployments/${id}`);
}

