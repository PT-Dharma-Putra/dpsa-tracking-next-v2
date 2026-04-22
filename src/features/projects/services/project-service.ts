import { axiosInstance as apiClient } from '@/lib/axios';

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id: number;
  status: string;
  current_phase: number;
  marketing?: { name: string };
  client?: { name: string };
  created_at: string;
  updated_at: string;
  start_date?: string;
  due_date?: string;
  spk_number?: string;
  // Addendum fields
  parent_project_id?: number | null;
  addendum_number?: number | null;
  is_addendum?: boolean;
  parent_project?: { id: number; name: string } | null;
  addendums?: {
    id: number;
    name: string;
    addendum_number: number;
    status: string;
    current_phase: number;
  }[];
}

export interface CreateProjectPayload {
  name: string;
  client_id: string | number; // Form usually returns string, but user.id is number
  description?: string;
  due_date?: string;
  items?: {
    item: string;
    jumlah: number;
    harga?: number;
    satuan?: string;
    item_type?: string;
    dimensi_panjang?: string | number | null;
    dimensi_lebar?: string | number | null;
    dimensi_tinggi?: string | number | null;
  }[];
}

export const ProjectService = {
  // Get List
  getProjects: async (params?: any) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  // Get Detail
  getProject: async (id: string | number) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data;
  },

  // Create
  createProject: async (data: CreateProjectPayload) => {
    const response = await apiClient.post('/projects', data);
    return response.data.data;
  },

  // Advance Phase (Gate Logic)
  advancePhase: async (
    id: string | number,
    force: boolean = false,
    reason?: string
  ) => {
    const response = await apiClient.patch(`/projects/${id}/advance-phase`, {
      force,
      reason,
    });
    return response.data;
  },

  // Update
  updateProject: async (id: string | number, data: Partial<Project> | any) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.data;
  },

  // Get Overview Data
  getOverview: async (id: string | number) => {
    const response = await apiClient.get<{
      project: Project;
      stats: any;
      matrix: any[];
      activity_stream: string[];
      detailed_activities: any[];
    }>(`/projects/${id}/overview`);
    return response.data;
  },

  // SPH / Quotation
  getSPHItems: async (id: number | string) => {
    const response = await apiClient.get(`/projects/${id}/sph/items`);
    return response.data.data;
  },

  saveSPHItems: async (id: number | string, items: any[]) => {
    const response = await apiClient.post(`/projects/${id}/sph/items`, {
      items,
    });
    return response.data;
  },

  saveSPHNumber: async (id: number | string, sphNumber: string) => {
    const response = await apiClient.post(`/projects/${id}/sph/save-number`, {
      sph_number: sphNumber,
    });
    return response.data;
  },

  uploadSPH: async (id: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/projects/${id}/sph/upload-file`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  // SPK / Contract
  getSPK: async (id: number | string) => {
    const response = await apiClient.get(`/projects/${id}/spk`);
    return response.data;
  },

  saveSPKNumber: async (
    id: number | string,
    spkNumber: string,
    deadline?: string
  ) => {
    const payload: any = { spk_number: spkNumber };
    if (deadline) payload.deadline = deadline;
    const response = await apiClient.post(
      `/projects/${id}/spk/save-number`,
      payload
    );
    return response.data;
  },

  uploadSPK: async (id: number | string, file: File) => {
    const formData = new FormData();
    formData.append('spk_file', file);
    const response = await apiClient.post(
      `/projects/${id}/spk/upload-file`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  // Production Items (ProjectItem)
  getItems: async (id: number | string) => {
    const response = await apiClient.get(`/projects/${id}/items`);
    return response.data.data;
  },

  syncSPHItems: async (id: number | string) => {
    const response = await apiClient.post(`/projects/${id}/items/sync-sph`, {});
    return response.data;
  },

  // Addendum
  createAddendum: async (
    parentId: number | string,
    data: { description?: string; items?: any[] }
  ) => {
    const response = await apiClient.post(
      `/projects/${parentId}/addendums`,
      data
    );
    return response.data.data;
  },

  getAddendums: async (parentId: number | string) => {
    const response = await apiClient.get(`/projects/${parentId}/addendums`);
    return response.data.data;
  },
};
