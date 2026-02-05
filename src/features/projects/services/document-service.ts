import { axiosInstance as apiClient } from "@/lib/axios";

export const DocumentService = {
    getDocuments: async (projectId: number | string, type?: string, itemId?: number) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (itemId) params.append('item_id', itemId.toString());

        const response = await apiClient.get(`/projects/${projectId}/documents?${params.toString()}`);
        return response.data;
    },

    uploadDocument: async (projectId: number | string, file: File, type: string, itemId?: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (itemId) {
            formData.append('sph_item_id', itemId.toString());
        }

        const response = await apiClient.post(`/projects/${projectId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteDocument: async (projectId: number | string, documentId: number) => {
        const response = await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
        return response.data;
    },

    // Engineering Handover
    uploadEngineeringHandover: async (projectId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(`/projects/${projectId}/engineering/handover`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // SPH (Quotation) Documents
    getSPH: async (projectId: number | string) => {
        const response = await apiClient.get(`/projects/${projectId}/documents?type=sph`);
        return response.data;
    },

    // SPK (Work Order) Documents
    getSPK: async (projectId: number | string) => {
        const response = await apiClient.get(`/projects/${projectId}/documents?type=spk`);
        return response.data;
    },

    // Invoice Documents
    getInvoices: async (projectId: number | string) => {
        const response = await apiClient.get(`/projects/${projectId}/documents?type=invoice`);
        return response.data;
    },

    // Approve SPH
    approveSPH: async (projectId: number | string) => {
        const response = await apiClient.post(`/projects/${projectId}/sph/approve`);
        return response.data;
    }
};
