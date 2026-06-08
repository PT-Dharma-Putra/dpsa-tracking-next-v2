import { axiosInstance as apiClient } from "@/lib/axios";

export interface Mdl {
    id: number;
    lantai: string;
    kategori_mdl_id: number | null;
    sub_kategori_mdl_id: number | null;
    lokasi_mdl_id: number | null;
    barang_id: number | null;
    kode_mdl: string;
    kategori_mdl?: { id: number; nama: string; kode: string } | null;
    sub_kategori_mdl?: { id: number; nama: string; kode: string } | null;
    lokasi_mdl?: { id: number; nama: string; kode: string } | null;
    barang?: { id: number; nama: string; kode: string } | null;
    created_at?: string;
    updated_at?: string;
}

export const MdlService = {
    getMdl: async (params?: { page?: number; search?: string; per_page?: number }): Promise<{ data: Mdl[]; meta: any }> => {
        const response = await apiClient.get("/mdl-v2", { params });
        return response.data;
    },
    createMdl: async (data: Partial<Mdl>) => {
        const response = await apiClient.post("/mdl-v2", data);
        return response.data;
    },
    updateMdl: async (id: number, data: Partial<Mdl>) => {
        const response = await apiClient.put(`/mdl-v2/${id}`, data);
        return response.data;
    },
    deleteMdl: async (id: number) => {
        const response = await apiClient.delete(`/mdl-v2/${id}`);
        return response.data;
    },
    importMdl: async (items: any[]) => {
        const response = await apiClient.post("/mdl-v2/bulk", { items });
        return response.data;
    },
};
