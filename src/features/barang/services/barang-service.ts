import { axiosInstance as apiClient } from "@/lib/axios";

export interface Barang {
    id: number;
    nama: string;
    kode: string;
    spesifikasi?: string | null;
    panjang?: number | null;
    lebar?: number | null;
    tinggi?: number | null;
    satuan?: string | null;
    harga?: number | null;
    garansi?: string | null;
    link_gambar_kerja?: string | null;
    created_at?: string;
    updated_at?: string;
}

export const BarangService = {
    getBarang: async (params?: {
        page?: number;
        search?: string;
        per_page?: number;
    }): Promise<{ data: Barang[]; meta: any }> => {
        const response = await apiClient.get("/barang", { params });
        return response.data;
    },
    createBarang: async (data: Partial<Barang>) => {
        const response = await apiClient.post("/barang", data);
        return response.data;
    },
    updateBarang: async (id: number, data: Partial<Barang>) => {
        const response = await apiClient.put(`/barang/${id}`, data);
        return response.data;
    },
    deleteBarang: async (id: number) => {
        const response = await apiClient.delete(`/barang/${id}`);
        return response.data;
    },
    importBarang: async (
        items: Partial<Omit<Barang, "id" | "created_at" | "updated_at">>[]
    ) => {
        const response = await apiClient.post("/barang/bulk", { items });
        return response.data;
    },
};
