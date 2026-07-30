import { axiosInstance } from "@/lib/axios";
import { User } from "@/features/auth/types";

export interface ApprovalStats {
    total_pending: number;
    pending_staff: number;
    pending_client: number;
}

export interface TargetPermissionsResponse {
    permission_ids: number[];
    role_permission_ids?: number[];
    direct_permission_ids?: number[];
    has_custom_permissions?: boolean;
}

export interface Role {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export const adminService = {
    // Get all pending users
    getPendingUsers: async () => {
        const { data } = await axiosInstance.get<{ data: User[] }>('/admin/users/pending');
        return data.data;
    },

    // Get all users (Active + Pending + Rejected)
    getAllUsers: async (params?: { page?: number, search?: string, per_page?: number }) => {
        const { data } = await axiosInstance.get<{ 
            data: User[], 
            meta: { 
                current_page: number, 
                last_page: number, 
                total: number, 
                per_page: number 
            } 
        }>('/users', { params });
        return data;
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
    },

    // New CRUD methods
    createUser: async (payload: any) => {
        const { data } = await axiosInstance.post('/users', payload);
        return data;
    },

    updateUser: async (userId: number, payload: any) => {
        const { data } = await axiosInstance.put(`/users/${userId}`, payload);
        return data;
    },

    deleteUser: async (userId: number) => {
        const { data } = await axiosInstance.delete(`/users/${userId}`);
        return data;
    },

    getRoles: async () => {
        const { data } = await axiosInstance.get<{ data: any[] }>('/users/roles');
        return data.data;
    },

    // Detailed Roles CRUD
    getRolesPaginated: async (params?: { page?: number, search?: string }) => {
        const { data } = await axiosInstance.get<{
            data: {
                data: Role[],
                current_page: number,
                last_page: number,
                total: number,
                per_page: number
            }
        }>('/roles', { params });
        return data.data;
    },

    createRole: async (payload: { name: string }) => {
        const { data } = await axiosInstance.post('/roles', payload);
        return data;
    },

    updateRole: async (id: number, payload: { name: string }) => {
        const { data } = await axiosInstance.put(`/roles/${id}`, payload);
        return data;
    },

    deleteRole: async (id: number) => {
        const { data } = await axiosInstance.delete(`/roles/${id}`);
        return data;
    },

    // Access Management Matrix & Permission APIs
    getAccessMatrix: async () => {
        const { data } = await axiosInstance.get<{ data: any[] }>('/access-management/matrix');
        return data.data;
    },

    getRolePermissions: async (roleId: number) => {
        const { data } = await axiosInstance.get<TargetPermissionsResponse>(`/access-management/roles/${roleId}/permissions`);
        return data;
    },

    updateRolePermissions: async (roleId: number, permissionIds: number[]) => {
        const { data } = await axiosInstance.put(`/access-management/roles/${roleId}/permissions`, { permission_ids: permissionIds });
        return data;
    },

    copyRolePermissions: async (targetRoleId: number, sourceRoleId: number) => {
        const { data } = await axiosInstance.post(`/access-management/roles/${targetRoleId}/copy-from`, { source_role_id: sourceRoleId });
        return data;
    },

    getUserPermissions: async (userId: number) => {
        const { data } = await axiosInstance.get<TargetPermissionsResponse>(`/access-management/users/${userId}/permissions`);
        return data;
    },

    updateUserPermissions: async (userId: number, permissionIds: number[]) => {
        const { data } = await axiosInstance.put(`/access-management/users/${userId}/permissions`, { permission_ids: permissionIds });
        return data;
    },

    getUserSidebarMenus: async () => {
        const { data } = await axiosInstance.get<{ data: any[] }>('/access-management/user-menus');
        return data.data;
    },

    // Menu CRUD APIs
    getMenus: async (params?: { search?: string, flat?: boolean }) => {
        const { data } = await axiosInstance.get<{ data: any[] }>('/menus', { params });
        return data.data;
    },

    getParentMenus: async () => {
        const { data } = await axiosInstance.get<{ data: any[] }>('/menus/parents');
        return data.data;
    },

    createMenu: async (payload: any) => {
        const { data } = await axiosInstance.post('/menus', payload);
        return data;
    },

    updateMenu: async (id: number, payload: any) => {
        const { data } = await axiosInstance.put(`/menus/${id}`, payload);
        return data;
    },

    deleteMenu: async (id: number) => {
        const { data } = await axiosInstance.delete(`/menus/${id}`);
        return data;
    }
};
