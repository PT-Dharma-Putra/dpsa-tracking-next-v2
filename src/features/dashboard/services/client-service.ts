import { axiosInstance } from "@/lib/axios";

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    progress: number;
    description: string;
    thumbnail: string | null;
    total_items: number;
    last_updated_at?: string;
    created_at: string;
}


export interface ActionItem {
    id: string;
    type: 'invoice' | 'sph' | 'design' | 'general';
    title: string;
    subtitle: string;
    projectId: number;
    projectName: string;
    cta_label: string;
    cta_link: string;
    urgent: boolean;
}

export interface FinanceSummary {
    total_contract_value: number;
    total_paid: number;
    total_outstanding: number;
    upcoming_due_date: string | null;
}

export interface ClientInvoice {
    id: string;
    invoice_number: string;
    amount: number;
    status: 'paid' | 'unpaid' | 'overdue';
    due_date: string;
    project_name: string;
    project_id: number;
}

export const ClientService = {
    getMyProjects: async (): Promise<ClientProject[]> => {
        const response = await axiosInstance.get('/orders/mdl/client');
        return response.data.data;
    },

    getActionItems: async (): Promise<ActionItem[]> => {
        const response = await axiosInstance.get('/client/actions');
        // If API returns wrapped response { data: [...] }
        return response.data.data || response.data;
    },

    getRecentActivity: async (limit: number = 5): Promise<string[]> => {
        const response = await axiosInstance.get('/client/activity-logs', { params: { limit } });
        return response.data.data || [];
    },

    getFinanceSummary: async (): Promise<{ summary: FinanceSummary, invoices: ClientInvoice[] }> => {
        // TODO: Real API
        return {
            summary: {
                total_contract_value: 450000000,
                total_paid: 150000000,
                total_outstanding: 300000000,
                upcoming_due_date: '2024-02-15'
            },
            invoices: [
                {
                    id: '1',
                    invoice_number: 'INV/2024/001',
                    amount: 150000000,
                    status: 'paid',
                    due_date: '2024-01-15',
                    project_name: 'Office Renovation - SCBD',
                    project_id: 1
                },
                {
                    id: '2',
                    invoice_number: 'INV/2024/002',
                    amount: 100000000,
                    status: 'unpaid',
                    due_date: '2024-02-15',
                    project_name: 'Office Renovation - SCBD',
                    project_id: 1
                },
                {
                    id: '3',
                    invoice_number: 'INV/2024/003',
                    amount: 25000000,
                    status: 'overdue',
                    due_date: '2024-01-20',
                    project_name: 'Apartment Menteng',
                    project_id: 2
                }
            ]
        };
    }
};
