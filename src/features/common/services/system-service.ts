import { axiosInstance as apiClient } from "@/lib/axios";

export const SystemService = {
    // Get Recent Activity Logs (Global)
    getRecentActivity: async (limit: number = 10) => {
        // Assuming there is an endpoint for generic logs or we use parsed activity stream
        // Since backend might not have this specific endpoint yet, we might need to mock or reuse project overview logic.
        // For now, let's try getting activity logs globally if endpoint exists, otherwise fallback to projects recent updates.

        // Let's try to hit a 'dashboard/activity' endpoint if we built it?
        // Checking API_REFERENCE.md... nothing.
        // We will target '/activity-logs' if standard, but user has 'getOverview' in project service.

        // Let's create a generic endpoint call, user can implement backend later if 404.
        const response = await apiClient.get("/activity-logs", { params: { limit } });
        return response.data;
    }
};
