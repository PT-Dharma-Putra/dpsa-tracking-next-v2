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
    }
}
