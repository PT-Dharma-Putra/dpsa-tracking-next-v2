import { axiosInstance as apiClient } from "@/lib/axios";

export interface Client {
    id: number;
    name: string;
    email: string;
}

export const ClientService = {
    getClients: async (params?: { page?: number; search?: string }) => {
        const response = await apiClient.get("/clients", { params });
        return response.data;
    },
};
