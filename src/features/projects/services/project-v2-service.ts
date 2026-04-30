import { axiosInstance as apiClient } from '@/lib/axios';

export interface ProjectV2 {
    id: number;
    name: string;
    description: string | null;
    client_id: number;
    deadline: string | null;
    status: string;
    client?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface ProjectV2Response {
    data: ProjectV2[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface GetProjectsV2Params {
    page?: number;
    search?: string;
    client_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export const projectV2Service = {
    getProjects: async (params?: GetProjectsV2Params) => {
        const { data } = await apiClient.get<ProjectV2Response>('/projects-v2', { params });
        return data;
    },

    getProject: async (id: number) => {
        const { data } = await apiClient.get<ProjectV2>(`/projects-v2/${id}`);
        return data;
    },

    createProject: async (payload: { name: string; client_id: number; description?: string; deadline?: string }) => {
        const { data } = await apiClient.post<ProjectV2>('/projects-v2', payload);
        return data;
    },

    updateProject: async (id: number, payload: { name: string; client_id: number; description?: string; deadline?: string }) => {
        const { data } = await apiClient.put<ProjectV2>(`/projects-v2/${id}`, payload);
        return data;
    },

    deleteProject: async (id: number) => {
        const { data } = await apiClient.delete(`/projects-v2/${id}`);
        return data;
    },

    // Project Items V2
    getProjectItems: async (projectId: number) => {
        const { data } = await apiClient.get<ProjectItemV2[]>(`/projects-v2/${projectId}/items`);
        return data;
    },

    createProjectItemsBulk: async (projectId: number, items: any[]) => {
        const { data } = await apiClient.post<ProjectItemV2[]>(`/projects-v2/${projectId}/items/bulk`, { items });
        return data;
    },

    updateProjectItem: async (id: number, payload: any) => {
        const { data } = await apiClient.put<ProjectItemV2>(`/projects-v2-items/${id}`, payload);
        return data;
    },

    deleteProjectItem: async (id: number) => {
        const { data } = await apiClient.delete(`/projects-v2-items/${id}`);
        return data;
    },

    getMDLItems: async (params?: { search?: string; page?: number; per_page?: number }) => {
        const { data } = await apiClient.get<any>('/mdl', { params });
        return data;
    }
}

export interface MDLItem {
    id: number;
    kategori_mdl: string;
    sub_kategori: string | null;
    kode_barang: string | null;
    nama_barang: string;
    // other fields omitted for brevity
}

export interface ProjectItemV2 {
    id: number;
    project_id: number;
    mdl_item_id: number | null;
    lantai: string | null;
    ruang: string | null;
    item: string;
    keterangan: string | null;
    volume: number | null;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    satuan: string | null;
    harga: number | null;
    jumlah: number;
    created_at: string;
    updated_at: string;
}
