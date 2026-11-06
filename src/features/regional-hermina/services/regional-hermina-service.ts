import { axiosInstance as apiClient } from "@/lib/axios";

export interface RegionalHermina {
    id: number;
    regional: string;
    angka_romawi?: string | null;
    nama_direktur?: string | null;
    keterangan?: string | null;
    created_at?: string;
    updated_at?: string;
}

export const RegionalHerminaService = {
    getRegionalHermina: async (params?: { search?: string }): Promise<RegionalHermina[]> => {
        const response = await apiClient.get<RegionalHermina[]>("/regional-hermina", { params });
        return response.data;
    },
    createRegionalHermina: async (data: Partial<RegionalHermina>): Promise<RegionalHermina> => {
        const response = await apiClient.post<RegionalHermina>("/regional-hermina", data);
        return response.data;
    },
    updateRegionalHermina: async (id: number, data: Partial<RegionalHermina>): Promise<RegionalHermina> => {
        const response = await apiClient.put<RegionalHermina>(`/regional-hermina/${id}`, data);
        return response.data;
    },
    deleteRegionalHermina: async (id: number): Promise<void> => {
        await apiClient.delete(`/regional-hermina/${id}`);
    },
};
