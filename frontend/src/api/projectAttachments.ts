import { api } from './client';

const DEFAULT_CATEGORY = '原始附件';

export function listProjectAttachments(projectId: number, category = DEFAULT_CATEGORY) {
  return api.get('/project-attachments', { params: { projectId, category } });
}

export function uploadProjectAttachment(projectId: number, file: File, category = DEFAULT_CATEGORY) {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/project-attachments/upload', fd, {
    params: { projectId, category },
  });
}

export function getProjectAttachmentDownloadUrl(id: number, expiry?: number) {
  return api.get(`/project-attachments/${id}/download-url`, {
    params: expiry != null ? { expiry } : {},
  });
}

export function deleteProjectAttachment(id: number) {
  return api.delete(`/project-attachments/${id}`);
}

export { DEFAULT_CATEGORY as PROJECT_ATTACHMENT_CATEGORY_ORIGINAL };
