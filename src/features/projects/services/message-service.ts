import { axiosInstance } from "@/lib/axios";

export interface ProjectMessage {
    id: number;
    project_id: number;
    user_id: number;
    message: string;
    type: 'user' | 'system';
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export const MessageService = {
    // Get Messages
    getMessages: async (projectId: string | number, page = 1) => {
        const response = await axiosInstance.get(`/projects/${projectId}/messages?page=${page}`);
        return response.data; // Expect { success: true, data: { data: [], ... } }
    },

    // Send Message
    sendMessage: async (projectId: string | number, message: string) => {
        const response = await axiosInstance.post(`/projects/${projectId}/messages`, { message });
        return response.data;
    }
};
