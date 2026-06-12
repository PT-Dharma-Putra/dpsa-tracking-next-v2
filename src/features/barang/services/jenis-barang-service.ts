import { axiosInstance as apiClient } from "@/lib/axios";

export interface JenisBarang {
    id: number;
    nama: string;
}

export const JenisBarangService = {
    getAll: async (): Promise<JenisBarang[]> => {
        const response = await apiClient.get("/jenis-barang");
        return response.data;
    },
    create: async (nama: string): Promise<JenisBarang> => {
        const response = await apiClient.post("/jenis-barang", { nama });
        return response.data;
    },
    update: async (id: number, nama: string): Promise<JenisBarang> => {
        const response = await apiClient.put(`/jenis-barang/${id}`, { nama });
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/jenis-barang/${id}`);
    },
};
