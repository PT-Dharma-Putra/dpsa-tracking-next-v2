import axios from 'axios';
// import { getAuthHeaders } from '@/lib/utils'; // Assuming this utility exists, if not we'll use standard headers
// Or better, use the configured axios instance if available. 
// Let's assume standard axios for now with local storage token.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ProductionJob {
    id: string;
    project_item_id: number;
    stage: string;
    operator_id: number;
    start_time: string;
    end_time: string | null;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
    notes?: string;
}

export const JobService = {
    /**
     * Start a production job for an item
     */
    startJob: async (projectItemId: number, stage: string, notes?: string): Promise<ProductionJob> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/production/job/start`,
            { project_item_id: projectItemId, stage, notes },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.data;
    },

    /**
     * Finish the current active job for an item
     */
    finishJob: async (projectItemId: number, notes?: string): Promise<ProductionJob> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/production/job/finish`,
            { project_item_id: projectItemId, notes },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.data;
    }
};
