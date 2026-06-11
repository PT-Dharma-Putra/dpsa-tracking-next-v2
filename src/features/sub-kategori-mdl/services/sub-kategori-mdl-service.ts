import { axiosInstance as apiClient } from "@/lib/axios";

export interface SubKategoriMDL {
    id: number;
    nama: string;
    kode: string;
    created_at?: string;
    updated_at?: string;
}

export const SubKategoriMDLService = {
    getSubKategori: async (params?: { page?: number; search?: string; per_page?: number }): Promise<{ data: SubKategoriMDL[]; meta: any }> => {
        const response = await apiClient.get("/sub-kategori-mdl", { params });
        return response.data;
    },
    createSubKategori: async (data: Partial<SubKategoriMDL>) => {
        const response = await apiClient.post("/sub-kategori-mdl", data);
        return response.data;
    },
    updateSubKategori: async (id: number, data: Partial<SubKategoriMDL>) => {
        const response = await apiClient.put(`/sub-kategori-mdl/${id}`, data);
        return response.data;
    },
    deleteSubKategori: async (id: number) => {
        const response = await apiClient.delete(`/sub-kategori-mdl/${id}`);
        return response.data;
    },
    importSubKategori: async (items: { nama: string; kode: string }[]) => {
        const response = await apiClient.post("/sub-kategori-mdl/bulk", { items });
        return response.data;
    },
};
