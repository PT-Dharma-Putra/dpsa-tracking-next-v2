import { axiosInstance as apiClient } from "@/lib/axios";

export interface Client {
    id: number;
    name: string;
    email: string;
}

export const ClientService = {
    getClients: async (params?: any) => {
        const response = await apiClient.get("/clients", { params });
        return response.data;
    },
};
