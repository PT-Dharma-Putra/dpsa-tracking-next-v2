import { axiosInstance } from "@/lib/axios";

export interface ClientProject {
    id: number;
    name: string;
    client_id?: number;
    client_name?: string | null;
    client_hermina?: number | null;
    regional_hermina_id?: number | null;
    status: string;
    progress: number;
    description: string;
    thumbnail: string | null;
    total_items: number;
    last_updated_at?: string;
    created_at: string;
    nomor_spk?: string | null;
    tanggal_spk?: string | null;
    tanggal_masuk?: string | null;
    tanggal_selesai?: string | null;
}

export interface HerminaClient {
    id: number;
    kode?: number | string | null;
    name: string;
    company_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    address?: string | null;
    director_name?: string | null;
    general_affair_name?: string | null;
    general_affair_hp?: string | null;
    projects_count?: number;
    hermina: number;
    regional_hermina_id?: number | null;
    regional_hermina?: {
        id: number;
        regional: string;
        angka_romawi?: string | null;
        nama_direktur?: string | null;
    } | null;
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
    getMyProjects: async (clientId?: number, regionalHerminaId?: number): Promise<ClientProject[]> => {
        const params: any = {};
        if (clientId) params.client_id = clientId;
        if (regionalHerminaId) params.regional_hermina_id = regionalHerminaId;
        const response = await axiosInstance.get('/orders/mdl/client', {
            params: Object.keys(params).length > 0 ? params : undefined
        });
        return response.data.data;
    },

    getHerminaClients: async (regionalHerminaId?: number): Promise<HerminaClient[]> => {
        const params: any = { hermina: 1, per_page: -1, sort_by: 'kode', sort_order: 'asc' };
        if (regionalHerminaId) params.regional_hermina_id = regionalHerminaId;
        const response = await axiosInstance.get('/clients', { params });
        return response.data.data || response.data || [];
    },

    getManagedByHerminaClients: async (regionalHerminaId?: number): Promise<HerminaClient[]> => {
        const params: any = { hermina: 2, per_page: -1, sort_by: 'kode', sort_order: 'asc' };
        if (regionalHerminaId) params.regional_hermina_id = regionalHerminaId;
        const response = await axiosInstance.get('/clients', { params });
        return response.data.data || response.data || [];
    },

    getClientsByRegional: async (regionalId: number, herminaType?: number): Promise<HerminaClient[]> => {
        const params: any = {
            regional_hermina_id: regionalId,
            per_page: -1,
            sort_by: 'kode',
            sort_order: 'asc'
        };
        if (herminaType !== undefined) {
            params.hermina = herminaType;
        }
        const response = await axiosInstance.get('/clients', { params });
        return response.data.data || response.data || [];
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
