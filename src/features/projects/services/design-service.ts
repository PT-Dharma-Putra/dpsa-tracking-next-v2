import { axiosInstance as apiClient } from "@/lib/axios";

export type DesignStatus = 'NONE' | 'TODO' | 'ON_DESIGN' | 'IN_REVIEW' | 'REVISION' | 'DONE';

export interface DesignLog {
    id: number;
    progress: number;
    status: string;
    note: string;
    created_at: string;
    user?: { name: string };
}

export interface SPHItem {
    id: number;
    project_id: number;
    name: string;
    qty: number;
    unit_price: number;
    total_price: number;
    needs_design: boolean;
    design_status: DesignStatus;
    design_progress: number;
    design_brief?: string;
    logs?: DesignLog[];
}

export interface DesignSummary {
    total_items: number;
    design_needed: number;
    avg_progress: number;
}

export const DesignService = {
    // Get Items & Summary
    getItems: async (projectId: string | number) => {
        const response = await apiClient.get<{ items: SPHItem[], summary: DesignSummary }>(`/projects/${projectId}/design-items`);
        return response.data;
    },

    // Marketing: Toggle Needs Design
    toggleNeedsDesign: async (itemId: number, needsDesign: boolean) => {
        const response = await apiClient.patch(`/design-items/${itemId}/needs-design`, {
            needs_design: needsDesign
        });
        return response.data;
    },

    // Marketing: Upload Brief
    uploadBrief: async (itemId: number, file: File) => {
        const formData = new FormData();
        formData.append("brief_file", file);

        const response = await apiClient.post(`/design-items/${itemId}/upload-brief`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Studio: Update Status
    updateStatus: async (itemId: number, status: DesignStatus) => {
        const response = await apiClient.patch(`/design-items/${itemId}/status`, {
            status
        });
        return response.data;
    },

    // Studio: Update Progress
    updateProgress: async (itemId: number, progress: number, note: string) => {
        const response = await apiClient.post(`/design-items/${itemId}/progress`, {
            progress,
            note
        });
        return response.data;
    }
};
