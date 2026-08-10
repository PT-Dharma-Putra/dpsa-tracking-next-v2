import { axiosInstance as apiClient } from "@/lib/axios";

export interface Client {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    director_name?: string | null;
    hermina: number;
    created_at?: string;
    projects_count?: number;
}

export const ClientService = {
    getClients: async (params?: { page?: number; search?: string; per_page?: number; sort_by?: string; sort_order?: string; hermina?: number }): Promise<{ data: Client[]; meta: any; stats?: { total: number; hermina: number; non_hermina: number } }> => {
        const response = await apiClient.get("/clients", { params });
        return response.data;
    },
    createClient: async (data: Partial<Client>) => {
        const response = await apiClient.post("/clients", data);
        return response.data;
    },
    updateClient: async (id: number, data: Partial<Client>) => {
        const response = await apiClient.put(`/clients/${id}`, data);
        return response.data;
    },
    deleteClient: async (id: number) => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },
};
