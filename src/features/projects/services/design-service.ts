import { axiosInstance } from "@/lib/axios";

export interface Design {
    id: number;
    title: string;
    type: 'initial' | 'revision' | 'final';
    status: 'pending' | 'approved' | 'rejected';
    image_url: string;
    uploaded_at: string;
    uploader: string;
    comment?: string;
}

export const DesignService = {
    // --- Client / Approval Features ---
    getProjectDesigns: async (projectId: number | string): Promise<Design[]> => {
        const response = await axiosInstance.get(`/projects/${projectId}/client-designs`);
        return response.data.data;
    },

    approveDesign: async (designId: number) => {
        const response = await axiosInstance.post(`/client-designs/${designId}/approve`);
        return response.data;
    },

    rejectDesign: async (designId: number, comment: string) => {
        const response = await axiosInstance.post(`/client-designs/${designId}/reject`, { comment });
        return response.data;
    },

    seedDummyDesigns: async (projectId: number | string) => {
        const response = await axiosInstance.get(`/projects/${projectId}/debug-design-seed`);
        return response.data;
    },

    // --- Internal / Studio Tracking Features (Restored) ---
    getItems: async (projectId: number | string) => {
        const response = await axiosInstance.get(`/projects/${projectId}/design-items`);
        return response.data; // Expected { summary: ..., items: ... }
    },

    toggleNeedsDesign: async (itemId: number, needsDesign: boolean) => {
        const response = await axiosInstance.patch(`/design-items/${itemId}/needs-design`, {
            needs_design: needsDesign
        });
        return response.data;
    },

    createItem: async (projectId: string | number, data: { name: string, qty: number, description?: string, needs_design?: boolean, floor?: string, room?: string }) => {
        const response = await axiosInstance.post(`/projects/${projectId}/sph/item`, {
            ...data,
            needs_design: data.needs_design !== undefined ? data.needs_design : true
        });
        return response.data;
    },

    updateStatus: async (itemId: number | string, status: DesignStatus) => {
        const response = await axiosInstance.patch(`/design-items/${itemId}/status`, { status });
        return response.data;
    },

    updateProgress: async (itemId: number | string, progress: number, note: string) => {
        const response = await axiosInstance.patch(`/design-items/${itemId}/progress`, { progress, note });
        return response.data;
    },

    deleteItem: async (projectId: string | number, itemId: number | string) => {
        const response = await axiosInstance.delete(`/projects/${projectId}/sph/items/${itemId}`);
        return response.data;
    },

    updateItem: async (projectId: string | number, itemId: number | string, data: { name?: string, qty?: number, specs?: string, needs_design?: boolean, floor?: string, room?: string }) => {
        const response = await axiosInstance.put(`/projects/${projectId}/sph/items/${itemId}`, data);
        return response.data;
    },

    uploadProjectBrief: async (projectId: string | number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/projects/${projectId}/upload-design-brief`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadBrief: async (itemId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/design-items/${itemId}/upload-brief`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteBrief: async (itemId: number | string) => {
        const response = await axiosInstance.delete(`/design-items/${itemId}/brief`);
        return response.data;
    },

    uploadDesign: async (itemId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/design-items/${itemId}/upload-design`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

// --- Restored Types ---
export type DesignStatus = 'TODO' | 'ON_DESIGN' | 'IN_REVIEW' | 'REVISION' | 'DONE';

export interface SPHItem {
    id: number;
    name: string;
    specs?: string;
    qty?: number;
    floor?: string;
    room?: string;
    unit_price?: number;
    total_price?: number;
    design_status: DesignStatus;
    design_progress: number;
    needs_design: boolean;
    design_brief?: string;
    design_file?: string;
    logs?: any[];
}
