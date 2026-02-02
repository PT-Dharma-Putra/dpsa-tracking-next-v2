import { axiosInstance } from "@/lib/axios";

export interface SPH {
    id: number;
    project_id: number;
    sph_number: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    file_path: string | null;
    file_url?: string | null; // Full URL from backend
    total_amount: number;
    created_at: string;
}

export interface SPK {
    id: number;
    project_id: number;
    spk_number: string;
    file_path?: string | null; // Deprecated
    spk_file_url?: string | null; // Backend returns this
    status: 'pending' | 'signed';
    created_at: string;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    term_name: string; // DP, Termin 1, Pelunasan
    amount: number;
    status: 'unpaid' | 'paid' | 'overdue';
    due_date: string;
    file_path: string | null;
}

export const DocumentService = {
    // --- SPH (Quotation) ---
    getSPH: async (projectId: string | number): Promise<SPH | null> => {
        try {
            const response = await axiosInstance.get(`/projects/${projectId}/sph`);
            return response.data.data;
        } catch (error) {
            return null; // Handle 404 gracefully
        }
    },

    approveSPH: async (projectId: string | number) => {
        const response = await axiosInstance.post(`/projects/${projectId}/sph/approve`);
        return response.data;
    },

    // --- SPK (Contract) ---
    getSPK: async (projectId: string | number): Promise<SPK | null> => {
        try {
            const response = await axiosInstance.get(`/projects/${projectId}/spk`);
            return response.data.data;
        } catch (error) {
            return null;
        }
    },

    uploadSignedSPK: async (projectId: string | number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'signed_spk');

        const response = await axiosInstance.post(`/projects/${projectId}/spk/upload-file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // --- Invoices ---
    getInvoices: async (projectId: string | number): Promise<Invoice[]> => {
        try {
            const response = await axiosInstance.get(`/projects/${projectId}/invoices`);
            return response.data.data;
        } catch (error) {
            return [];
        }
    }
};
