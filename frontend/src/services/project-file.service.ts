import { api } from '@/lib/api';

export type FileCategory = 'CONTRACTS' | 'DRAWINGS' | 'REPORTS' | 'PHOTOS' | 'OTHER';

export interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  url: string;
  mimeType?: string;
  size: number;
  category: FileCategory;
  uploadedById?: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
  };
}

interface FilesResponse {
  files: ProjectFile[];
}

interface FileResponse {
  file: ProjectFile;
}

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'CONTRACTS', label: 'Contracts' },
  { value: 'DRAWINGS', label: 'Drawings' },
  { value: 'REPORTS', label: 'Reports' },
  { value: 'PHOTOS', label: 'Photos' },
  { value: 'OTHER', label: 'Other' },
];

export const projectFileService = {
  async getByProject(projectId: string): Promise<ProjectFile[]> {
    const response = await api.get<FilesResponse>(`/project-files/${projectId}`);
    return response.files;
  },

  async upload(projectId: string, file: File, category: FileCategory = 'OTHER'): Promise<ProjectFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const token = api.getToken();
    const response = await fetch(`/api/project-files/${projectId}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result: FileResponse = await response.json();
    return result.file;
  },

  async updateCategory(fileId: string, category: FileCategory): Promise<ProjectFile> {
    const response = await api.put<FileResponse>(`/project-files/file/${fileId}`, { category });
    return response.file;
  },

  async delete(fileId: string): Promise<void> {
    await api.delete(`/project-files/file/${fileId}`);
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(mimeType?: string): string {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'sheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slides';
  if (mimeType.includes('dwg') || mimeType.includes('acad')) return 'cad';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  return 'file';
}
