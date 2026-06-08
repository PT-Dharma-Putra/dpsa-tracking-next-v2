import { axiosInstance as apiClient } from "@/lib/axios";

export interface KategoriBarang {
    id: number;
    nama: string;
    kode: string;
    created_at?: string;
    updated_at?: string;
}

export const KategoriBarangService = {
    getKategori: async (params?: { page?: number; search?: string; per_page?: number }): Promise<{ data: KategoriBarang[]; meta: any }> => {
        const response = await apiClient.get("/kategori-barang", { params });
        return response.data;
    },
    createKategori: async (data: Partial<KategoriBarang>) => {
        const response = await apiClient.post("/kategori-barang", data);
        return response.data;
    },
    updateKategori: async (id: number, data: Partial<KategoriBarang>) => {
        const response = await apiClient.put(`/kategori-barang/${id}`, data);
        return response.data;
    },
    deleteKategori: async (id: number) => {
        const response = await apiClient.delete(`/kategori-barang/${id}`);
        return response.data;
    },
    importKategori: async (items: { nama: string; kode: string }[]) => {
        const response = await apiClient.post("/kategori-barang/bulk", { items });
        return response.data;
    },
};
