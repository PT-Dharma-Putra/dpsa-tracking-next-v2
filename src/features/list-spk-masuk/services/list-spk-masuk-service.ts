import { axiosInstance as apiClient } from "@/lib/axios";

export interface ListSpkMasuk {
    id: number;
    tanggal_spk_masuk: string;
    marketing_id: number | null;
    marketing?: {
        id: number;
        name: string;
    } | null;
    client_id: number | null;
    client?: {
        id: number;
        name: string;
        company_name?: string | null;
    } | null;
    no_spk: string;
    nama_projek: string;
    is_uploaded: boolean;
    tanggal_upload: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ListSpkMasukParams {
    page?: number;
    per_page?: number;
    search?: string;
    marketing_id?: number;
    client_id?: number;
    is_uploaded?: boolean | string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ListSpkMasukResponse {
    data: ListSpkMasuk[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    stats?: {
        total: number;
        uploaded: number;
        not_uploaded: number;
    };
}

export const ListSpkMasukService = {
    getAll: async (params?: ListSpkMasukParams): Promise<ListSpkMasukResponse> => {
        const response = await apiClient.get<ListSpkMasukResponse>("/list-spk-masuk", { params });
        return response.data;
    },

    getById: async (id: number): Promise<{ data: ListSpkMasuk }> => {
        const response = await apiClient.get<{ data: ListSpkMasuk }>(`/list-spk-masuk/${id}`);
        return response.data;
    },

    create: async (payload: {
        tanggal_spk_masuk: string;
        marketing_id?: number | null;
        client_id: number;
        no_spk: string;
        nama_projek: string;
        is_uploaded?: boolean;
        tanggal_upload?: string | null;
    }) => {
        const response = await apiClient.post("/list-spk-masuk", payload);
        return response.data;
    },

    update: async (id: number, payload: {
        tanggal_spk_masuk: string;
        marketing_id?: number | null;
        client_id: number;
        no_spk: string;
        nama_projek: string;
        is_uploaded?: boolean;
        tanggal_upload?: string | null;
    }) => {
        const response = await apiClient.put(`/list-spk-masuk/${id}`, payload);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await apiClient.delete(`/list-spk-masuk/${id}`);
        return response.data;
    },

    getMarketings: async (): Promise<{ id: number; name: string }[]> => {
        try {
            const response = await apiClient.get<{ data: { id: number; name: string }[] }>("/list-spk-masuk/marketings");
            return response.data.data || [];
        } catch {
            return [];
        }
    },

    getClients: async (): Promise<{ id: number; name: string; company_name?: string | null }[]> => {
        try {
            const response = await apiClient.get<{ data: { id: number; name: string; company_name?: string | null }[] }>("/clients", {
                params: { per_page: -1 }
            });
            return response.data.data || [];
        } catch {
            return [];
        }
    }
};
