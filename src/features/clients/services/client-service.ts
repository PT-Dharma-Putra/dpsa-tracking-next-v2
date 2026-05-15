import { axiosInstance as apiClient } from "@/lib/axios";

export interface Client {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    hermina: number;
    created_at?: string;
    projects_count?: number;
}

export const ClientService = {
    getClients: async (params?: { page?: number; search?: string }) => {
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
