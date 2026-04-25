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
        const response = await apiClient.get(`/projects/${projectId}/sph`);
        return response.data.data;
    },

    // SPK (Work Order) Documents
    getSPK: async (projectId: number | string) => {
        const response = await apiClient.get(`/projects/${projectId}/spk`);
        return response.data.data;
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
    },

    // Reject SPH (Client)
    rejectSPH: async (projectId: number | string, reason: string) => {
        const response = await apiClient.post(`/projects/${projectId}/sph/reject`, { reason });
        return response.data;
    },

    // Upload Signed SPH (Client) -> Then usually followed by approve
    uploadSignedSPH: async (projectId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/projects/${projectId}/sph/upload-file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Revise SPH (Internal)
    reviseSPH: async (projectId: number | string, file: File, reason: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('reason', reason);
        const response = await apiClient.post(`/projects/${projectId}/sph/revise`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Revise SPK (Internal)
    reviseSPK: async (projectId: number | string, file: File, reason: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('reason', reason);
        const response = await apiClient.post(`/projects/${projectId}/spk/revise`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Approve SPK (with optional signed file)
    approveSPK: async (projectId: number | string, signedFile?: File) => {
        if (signedFile) {
            const formData = new FormData();
            formData.append('spk_signed_file', signedFile);
            const response = await apiClient.post(`/projects/${projectId}/spk/approve`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        }
        const response = await apiClient.post(`/projects/${projectId}/spk/approve`);
        return response.data;
    },

    // Reject SPK (Client)
    rejectSPK: async (projectId: number | string, reason: string) => {
        const response = await apiClient.post(`/projects/${projectId}/spk/reject`, { reason });
        return response.data;
    },

    // Upload Signed SPK (Client)
    uploadSignedSPK: async (projectId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('spk_file', file);
        // spk_number required by validation but we can omit if already exists. Controller check needed.
        // Assuming controller allows update if number exists.
        const response = await apiClient.post(`/projects/${projectId}/spk/upload-file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Upload Client SPK (with number, optional deadline, and file)
    uploadClientSPK: async (projectId: number | string, data: { spk_number: string; deadline?: string; file: File }) => {
        const formData = new FormData();
        formData.append('spk_number', data.spk_number);
        if (data.deadline) {
            formData.append('deadline', data.deadline);
        }
        formData.append('spk_file', data.file);
        const response = await apiClient.post(`/projects/${projectId}/spk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};
