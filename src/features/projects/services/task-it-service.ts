import { axiosInstance as apiClient } from '@/lib/axios';

export interface TaskIt {
    id: number;
    user_id: number;
    deskripsi: string;
    file: string | null;
    file_url?: string | null;
    status: string;
    tanggal_selesai: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export const taskItService = {
    getTasks: async () => {
        const { data } = await apiClient.get<TaskIt[]>('/task-it');
        return data;
    },

    createTask: async (payload: FormData) => {
        const { data } = await apiClient.post<TaskIt>('/task-it', payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    updateTask: async (id: number, payload: FormData) => {
        if (!payload.has('_method')) {
            payload.append('_method', 'PUT');
        }
        const { data } = await apiClient.post<TaskIt>(`/task-it/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    deleteTask: async (id: number) => {
        const { data } = await apiClient.delete(`/task-it/${id}`);
        return data;
    }
}
