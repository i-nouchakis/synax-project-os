export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface FloorPlanUploadResult {
  floor: {
    id: string;
    floorplanUrl: string;
    floorplanType: string;
  };
  upload: UploadResult;
}

export interface RoomFloorPlanUploadResult {
  room: {
    id: string;
    floorplanUrl: string;
    floorplanType: string;
  };
  upload: UploadResult;
}

const API_BASE = '/api';

export const uploadService = {
  /**
   * Upload a general image
   */
  async uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('synax_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Upload floor plan
   */
  async uploadFloorPlan(floorId: string, file: File): Promise<FloorPlanUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/floorplan/${floorId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('synax_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Upload checklist photo
   */
  async uploadChecklistPhoto(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/checklist-photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('synax_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Upload issue photo
   */
  async uploadIssuePhoto(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/issue-photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('synax_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Upload room floor plan
   */
  async uploadRoomFloorplan(roomId: string, file: File): Promise<RoomFloorPlanUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/room-floorplan/${roomId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('synax_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },
};
