import { axiosInstance as apiClient } from "@/lib/axios";

export interface MaterialPayload {
    material_name: string;
    quantity: number;
    unit: string;
    notes?: string;
}

export interface Material {
    id: number;
    sph_item_id: number;
    project_id: number;
    material_name: string;
    quantity: number;
    unit: string;
    notes?: string;
    status: 'pending' | 'available' | 'need_purchase' | 'released';
    warehouse_notes?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
}

export const MaterialService = {
    // Get materials for specific item
    getItemMaterials: async (projectId: number | string, itemId: number | string) => {
        const response = await apiClient.get(`/projects/${projectId}/items/${itemId}/materials`);
        return response.data;
    },

    // Add material
    addMaterial: async (projectId: number | string, itemId: number | string, data: MaterialPayload) => {
        const response = await apiClient.post(`/projects/${projectId}/items/${itemId}/materials`, data);
        return response.data;
    },

    // Update material (status, notes, etc)
    updateMaterial: async (projectId: number | string, materialId: number, data: Partial<MaterialPayload> & { status?: string; warehouse_notes?: string }) => {
        const response = await apiClient.put(`/projects/${projectId}/materials/${materialId}`, data);
        return response.data;
    },

    // Delete material
    deleteMaterial: async (projectId: number | string, materialId: number) => {
        const response = await apiClient.delete(`/projects/${projectId}/materials/${materialId}`);
        return response.data;
    },

    // Get all materials for project (Warehouse view)
    getProjectMaterials: async (projectId: number | string, status?: string) => {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get(`/projects/${projectId}/materials${params}`);
        return response.data;
    }
};
