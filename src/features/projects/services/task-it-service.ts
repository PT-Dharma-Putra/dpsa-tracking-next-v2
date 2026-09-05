import { axiosInstance as apiClient } from '@/lib/axios';

export interface TaskIt {
    id: number;
    user_id: number;
    pic_id?: number | null;
    project_id?: number | null;
    tipe?: 'Request Fitur' | 'Lapor Kendala' | 'Internal' | string;
    judul?: string | null;
    deskripsi: string;
    file: string | null;
    file_url?: string | null;
    status: string;
    prioritas: string;
    tanggal_selesai: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: {
        id: number;
        name: string;
        email: string;
        client_id?: number | null;
    };
    pic?: {
        id: number;
        name: string;
        email: string;
    } | null;
    project?: {
        id: number;
        name: string;
    } | null;
}

export const taskItService = {
    getTasks: async (params?: { tipe?: string; status?: string; project_id?: number }) => {
        const { data } = await apiClient.get<TaskIt[]>('/task-it', { params });
        return data;
    },

    createTask: async (payload: FormData) => {
        const { data } = await apiClient.post<TaskIt>('/task-it', payload);
        return data;
    },

    updateTask: async (id: number, payload: FormData) => {
        if (!payload.has('_method')) {
            payload.append('_method', 'PUT');
        }
        const { data } = await apiClient.post<TaskIt>(`/task-it/${id}`, payload);
        return data;
    },

    deleteTask: async (id: number) => {
        const { data } = await apiClient.delete(`/task-it/${id}`);
        return data;
    }
}
