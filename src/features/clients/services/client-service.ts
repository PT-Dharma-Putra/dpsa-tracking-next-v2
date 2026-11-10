import { axiosInstance as apiClient } from "@/lib/axios";

export interface Client {
    id: number;
    kode?: number | null;
    name: string;
    company_name?: string | null;
    director_name?: string | null;
    email?: string | null;
    hermina: number;
    regional_hermina_id?: number | null;
    regional_hermina?: {
        id: number;
        regional: string;
        angka_romawi?: string | null;
        nama_direktur?: string | null;
    } | null;
    finance_email?: string | null;
    phone_number?: string | null;
    phone?: string | null;
    address?: string | null;
    nama_jangum?: string | null;
    general_affair_name?: string | null;
    hp_jangum?: string | null;
    general_affair_hp?: string | null;
    rekening?: string | null;
    nama_bank?: string | null;
    npwp?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    projects_count?: number;
}

export const ClientService = {
    getClients: async (params?: { page?: number; search?: string; per_page?: number; sort_by?: string; sort_order?: string; hermina?: number }): Promise<{ data: Client[]; meta: any; stats?: { total: number; hermina: number; managed_by_hermina: number; non_hermina: number } }> => {
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
