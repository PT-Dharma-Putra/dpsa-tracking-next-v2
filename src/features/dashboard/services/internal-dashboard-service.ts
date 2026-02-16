import { axiosInstance } from "@/lib/axios";

export interface ActivityItem {
    id: number;
    user: string;
    action: string;
    target: string;
    time: string;
    initials: string;
}

export interface DashboardOverview {
    total_projects: number;
    pending_count: number;
    in_progress_count: number;
    completed_count: number;
    overdue_count: number;
    completion_rate: number;
    recent_activity: ActivityItem[];
}

export const InternalDashboardService = {
    getOverview: async (): Promise<DashboardOverview> => {
        const response = await axiosInstance.get('/dashboard/projects-overview');
        return response.data;
    }
};
