import { axiosInstance } from "@/lib/axios";
import { MDLItem, MDLQueryParams } from "../types";

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export const mdlService = {
    // Get MDL Items (Paginated)
    getItems: async (params?: MDLQueryParams) => {
        const { data } = await axiosInstance.get<PaginatedResponse<MDLItem>>('/mdl', { params });
        return data;
    },

    // Get Trashed Items
    getTrashedItems: async (params?: MDLQueryParams) => {
        const { data } = await axiosInstance.get<PaginatedResponse<MDLItem>>('/mdl/trashed', { params });
        return data;
    },

    // Get Single Item by ID
    getById: async (id: number) => {
        const { data } = await axiosInstance.get<MDLItem>(`/mdl/${id}`);
        return data;
    },

    // Get Categories (For Filters)
    getCategories: async () => {
        // Assuming there is an endpoint for categories, or we use a distinct query
        // If not, we might need to rely on static or aggregated list
        const { data } = await axiosInstance.get<string[]>('/mdl/categories');
        return data;
    },

    // Create Item
    createItem: async (item: Partial<MDLItem>) => {
        const { data } = await axiosInstance.post('/mdl', item);
        return data;
    },

    // Update Item
    updateItem: async (id: number, item: Partial<MDLItem>) => {
        const { data } = await axiosInstance.put(`/mdl/${id}`, item);
        return data;
    },

    // Delete Item (Soft)
    deleteItem: async (id: number) => {
        const { data } = await axiosInstance.delete(`/mdl/${id}`);
        return data;
    },

    // Restore Item
    restoreItem: async (id: number) => {
        const { data } = await axiosInstance.post(`/mdl/${id}/restore`);
        return data;
    },

    // Force Delete
    forceDeleteItem: async (id: number) => {
        const { data } = await axiosInstance.delete(`/mdl/${id}/force-delete`);
        return data;
    },

    // Upload Photo
    uploadPhoto: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('foto', file);
        const { data } = await axiosInstance.post(`/mdl/items/${id}/photo`, formData);
        return data;
    },

    // Download Template
    downloadTemplate: async () => {
        const response = await axiosInstance.get('/mdl/template', {
            responseType: 'blob',
        });
        return response.data;
    },

    // Bulk Store (Import)
    bulkStore: async (items: any[]) => {
        const { data } = await axiosInstance.post('/mdl/bulk', { items });
        return data;
    }
};
