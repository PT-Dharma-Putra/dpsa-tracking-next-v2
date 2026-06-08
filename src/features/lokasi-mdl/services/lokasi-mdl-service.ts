import { axiosInstance as apiClient } from "@/lib/axios";

export interface LokasiMDL {
    id: number;
    nama: string;
    kode: string;
    created_at?: string;
    updated_at?: string;
}

export const LokasiMDLService = {
    getLokasi: async (params?: { page?: number; search?: string; per_page?: number }): Promise<{ data: LokasiMDL[]; meta: any }> => {
        const response = await apiClient.get("/lokasi-mdl", { params });
        return response.data;
    },
    createLokasi: async (data: Partial<LokasiMDL>) => {
        const response = await apiClient.post("/lokasi-mdl", data);
        return response.data;
    },
    updateLokasi: async (id: number, data: Partial<LokasiMDL>) => {
        const response = await apiClient.put(`/lokasi-mdl/${id}`, data);
        return response.data;
    },
    deleteLokasi: async (id: number) => {
        const response = await apiClient.delete(`/lokasi-mdl/${id}`);
        return response.data;
    },
    importLokasi: async (items: { nama: string; kode: string }[]) => {
        const response = await apiClient.post("/lokasi-mdl/bulk", { items });
        return response.data;
    },
};
