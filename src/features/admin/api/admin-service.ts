import { axiosInstance } from "@/lib/axios";
import { User } from "@/features/auth/types";

export interface ApprovalStats {
    total_pending: number;
    pending_staff: number;
    pending_client: number;
}

export const adminService = {
    // Get all pending users
    getPendingUsers: async () => {
        const { data } = await axiosInstance.get<{ data: User[] }>('/admin/users/pending');
        return data.data;
    },

    // Get all users (Active + Pending + Rejected)
    getAllUsers: async () => {
        const { data } = await axiosInstance.get<{ data: User[] }>('/admin/users/all');
        return data.data;
    },

    // Get stats
    getStats: async () => {
        const { data } = await axiosInstance.get<{ data: ApprovalStats }>('/admin/users/approval-stats');
        return data.data;
    },

    // Actions
    approveUser: async (userId: number) => {
        const { data } = await axiosInstance.post(`/admin/users/${userId}/approve`);
        return data;
    },

    rejectUser: async (userId: number, reason: string) => {
        const { data } = await axiosInstance.post(`/admin/users/${userId}/reject`, { reason });
        return data;
    }
};
