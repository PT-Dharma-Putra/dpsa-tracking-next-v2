import { axiosInstance } from "@/lib/axios";

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    progress: number;
    description: string;
    thumbnail: string | null;
    total_items: number;
    created_at: string;
}

export const ClientService = {
    getMyProjects: async (): Promise<ClientProject[]> => {
        const response = await axiosInstance.get('/orders/mdl/client');
        return response.data.data;
    }
};
