import { axiosInstance as apiClient } from "@/lib/axios";

export const WarehouseService = {
    // Get Items for Procurement/Warehouse View
    getWarehouseItems: async (projectId: string | number) => {
        const response = await apiClient.get(`/projects/${projectId}/warehouse-items`);
        return response.data;
    },

    // Update Material Status
    updateMaterialStatus: async (itemId: number, status: string, date?: Date, pic?: string) => {
        const payload: any = { material_status: status };
        if (date) payload.material_date = date.toISOString();
        if (pic) payload.material_pic = pic;

        const response = await apiClient.patch(`/warehouse-items/${itemId}/material-status`, payload);
        return response.data;
    }
};
