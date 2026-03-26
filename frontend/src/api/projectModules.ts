import { api } from './client';

export function getProjectModules(projectId: number) {
  return api.get('/project-modules', { params: { projectId } });
}

export function createProjectModule(data: Record<string, unknown>) {
  return api.post('/project-modules', data);
}

export function updateProjectModule(id: number, data: Record<string, unknown>) {
  return api.patch(`/project-modules/${id}`, data);
}

export function deleteProjectModule(id: number) {
  return api.delete(`/project-modules/${id}`);
}

