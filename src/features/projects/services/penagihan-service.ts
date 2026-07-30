import { axiosInstance as apiClient } from '@/lib/axios';

export interface Termin {
    id: number;
    nama: string;
}

export interface Penagihan {
    id: number;
    project_id: number;
    termin_id: number;
    nomor_invoice: string | null;
    deskripsi: string | null;
    persentase: number;
    nominal_penagihan?: string | number | null;
    take_out?: string | number | null;
    tanggal_kirim: string | null;
    tanggal_invoice: string | null;
    jatuh_tempo: string | null;
    status: 'Belum Bayar' | 'Sebagian Dibayar' | 'Lunas';
    tanggal_dibayar: string | null;
    nominal_dibayar: number | string | null;
    file: string | null;
    termin?: Termin;
    project?: any;
    created_at: string;
    updated_at: string;
}

export interface CreatePenagihanPayload {
    project_id: number;
    termin_id: number;
    nomor_invoice?: string;
    deskripsi?: string;
    persentase: number;
    nominal_penagihan?: string;
    take_out?: string;
    tanggal_kirim?: string;
    tanggal_invoice?: string;
    jatuh_tempo?: string;
    status: 'Belum Bayar' | 'Sebagian Dibayar' | 'Lunas';
    tanggal_dibayar?: string;
    nominal_dibayar?: number;
    file?: File;
}

export const penagihanService = {
    // Termin CRUD
    getTermin: async (): Promise<Termin[]> => {
        const { data } = await apiClient.get<Termin[]>('/termin');
        return data;
    },

    createTermin: async (nama: string): Promise<Termin> => {
        const { data } = await apiClient.post<Termin>('/termin', { nama });
        return data;
    },

    updateTermin: async (id: number, nama: string): Promise<Termin> => {
        const { data } = await apiClient.put<Termin>(`/termin/${id}`, { nama });
        return data;
    },

    deleteTermin: async (id: number): Promise<void> => {
        await apiClient.delete(`/termin/${id}`);
    },

    // Penagihan CRUD
    getAllPenagihan: async (): Promise<Penagihan[]> => {
        const { data } = await apiClient.get<Penagihan[]>('/penagihan/all');
        return data;
    },

    getPenagihanByProject: async (projectId: number): Promise<Penagihan[]> => {
        const { data } = await apiClient.get<Penagihan[]>(`/projects-v2/${projectId}/penagihan`);
        return data;
    },

    createPenagihan: async (payload: CreatePenagihanPayload): Promise<Penagihan> => {
        const formData = new FormData();
        formData.append('project_id', payload.project_id.toString());
        formData.append('termin_id', payload.termin_id.toString());
        if (payload.nomor_invoice !== undefined) formData.append('nomor_invoice', payload.nomor_invoice);
        if (payload.deskripsi !== undefined) formData.append('deskripsi', payload.deskripsi);
        formData.append('persentase', payload.persentase.toString());
        formData.append('status', payload.status);
        if (payload.tanggal_kirim) formData.append('tanggal_kirim', payload.tanggal_kirim);
        if (payload.tanggal_invoice) formData.append('tanggal_invoice', payload.tanggal_invoice);
        if (payload.nominal_penagihan !== undefined) formData.append('nominal_penagihan', payload.nominal_penagihan);
        if (payload.take_out !== undefined) formData.append('take_out', payload.take_out);
        if (payload.jatuh_tempo) formData.append('jatuh_tempo', payload.jatuh_tempo);
        if (payload.tanggal_dibayar) formData.append('tanggal_dibayar', payload.tanggal_dibayar);
        if (payload.nominal_dibayar !== undefined) formData.append('nominal_dibayar', payload.nominal_dibayar.toString());
        if (payload.file) formData.append('file', payload.file);

        const { data } = await apiClient.post<Penagihan>('/penagihan', formData);
        return data;
    },

    updatePenagihan: async (id: number, payload: Partial<CreatePenagihanPayload>): Promise<Penagihan> => {
        const formData = new FormData();
        if (payload.termin_id !== undefined) formData.append('termin_id', payload.termin_id.toString());
        if (payload.nomor_invoice !== undefined) formData.append('nomor_invoice', payload.nomor_invoice);
        if (payload.deskripsi !== undefined) formData.append('deskripsi', payload.deskripsi);
        if (payload.persentase !== undefined) formData.append('persentase', payload.persentase.toString());
        if (payload.status) formData.append('status', payload.status);
        if (payload.tanggal_kirim) formData.append('tanggal_kirim', payload.tanggal_kirim);
        if (payload.tanggal_invoice) formData.append('tanggal_invoice', payload.tanggal_invoice);
        if (payload.nominal_penagihan !== undefined) formData.append('nominal_penagihan', payload.nominal_penagihan);
        if (payload.take_out !== undefined) formData.append('take_out', payload.take_out);
        if (payload.jatuh_tempo) formData.append('jatuh_tempo', payload.jatuh_tempo);
        if (payload.tanggal_dibayar) formData.append('tanggal_dibayar', payload.tanggal_dibayar);
        if (payload.nominal_dibayar !== undefined) formData.append('nominal_dibayar', payload.nominal_dibayar.toString());
        if (payload.file) formData.append('file', payload.file);
        formData.append('_method', 'PUT');

        const { data } = await apiClient.post<Penagihan>(`/penagihan/${id}`, formData);
        return data;
    },

    deletePenagihan: async (id: number): Promise<void> => {
        await apiClient.delete(`/penagihan/${id}`);
    },
};
