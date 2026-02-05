import { axiosInstance as apiClient } from "@/lib/axios";

export const PPICService = {
    // Bulk assign division
    bulkAssignDivisi: async (assignments: { item_id: number, divisi: string }[]) => {
        const response = await apiClient.post("/ppic/bulk-assign", { assignments });
        return response.data;
    },

    // Single assign (optional)
    assignDivisi: async (itemId: number, divisi: string) => {
        const response = await apiClient.post(`/ppic/item/${itemId}/assign`, { divisi });
        return response.data;
    },

    // Dokubah
    getDokubah: async (projectId: string | number) => {
        const response = await apiClient.get(`/ppic/dokubah/${projectId}`);
        return response.data;
    },

    uploadDokubah: async (projectId: string | number, file: File) => {
        const formData = new FormData();
        formData.append('dokubah_file', file);
        const response = await apiClient.post(`/ppic/dokubah/${projectId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
