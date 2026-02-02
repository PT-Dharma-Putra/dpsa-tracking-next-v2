import { axiosInstance } from "@/lib/axios";

export interface ActivityLog {
    id: number;
    user: string;
    action: string;
    target: string;
    time: string;
    initials: string;
}

export const InternalDashboardService = {
    getOverview: async () => {
        const response = await axiosInstance.get('/dashboard/projects-overview');
        return response.data;
    }
};
