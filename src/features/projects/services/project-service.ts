import { axiosInstance as apiClient } from "@/lib/axios";

export interface Project {
    id: number;
    name: string;
    description?: string;
    client_id: number;
    status: string;
    current_phase: number;
    marketing?: { name: string };
    client?: { name: string };
    created_at: string;
    updated_at: string;
}

export interface CreateProjectPayload {
    name: string;
    client_id: string; // Form usually returns string
    description?: string;
    due_date?: string;
}

export const ProjectService = {
    // Get List
    getProjects: async (params?: any) => {
        const response = await apiClient.get("/projects", { params });
        return response.data;
    },

    // Get Detail
    getProject: async (id: string | number) => {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data.data;
    },

    // Create
    createProject: async (data: CreateProjectPayload) => {
        const response = await apiClient.post("/projects", data);
        return response.data;
    },

    // Advance Phase (Gate Logic)
    advancePhase: async (id: string | number, force: boolean = false, reason?: string) => {
        const response = await apiClient.patch(`/projects/${id}/advance-phase`, {
            force,
            reason,
        });
        return response.data;
    },

    // Get Overview Data
    getOverview: async (id: string | number) => {
        const response = await apiClient.get<{ project: Project, stats: any, matrix: any[], activity_stream: any[] }>(`/projects/${id}/overview`);
        return response.data;
    },
};
