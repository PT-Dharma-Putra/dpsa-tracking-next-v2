import { axiosInstance as apiClient } from "@/lib/axios";

export interface KategoriMDL {
    id: number;
    nama: string;
    kode: string;
    spesifikasi?: string | null;
    dimensi?: string | null;
    created_at?: string;
    updated_at?: string;
}

export const KategoriMDLService = {
    getKategori: async (params?: { page?: number; search?: string; per_page?: number }): Promise<{ data: KategoriMDL[]; meta: any }> => {
        const response = await apiClient.get("/kategori-mdl", { params });
        return response.data;
    },
    createKategori: async (data: Partial<KategoriMDL>) => {
        const response = await apiClient.post("/kategori-mdl", data);
        return response.data;
    },
    updateKategori: async (id: number, data: Partial<KategoriMDL>) => {
        const response = await apiClient.put(`/kategori-mdl/${id}`, data);
        return response.data;
    },
    deleteKategori: async (id: number) => {
        const response = await apiClient.delete(`/kategori-mdl/${id}`);
        return response.data;
    },
    importKategori: async (items: { nama: string; kode: string }[]) => {
        const response = await apiClient.post("/kategori-mdl/bulk", { items });
        return response.data;
    },
};
