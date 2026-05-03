import { axiosInstance as apiClient } from '@/lib/axios';

export interface ProjectV2 {
    id: number;
    name: string;
    description: string | null;
    spk_number: string | null;
    client_id: number;
    deadline: string | null;
    status: string;
    client?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
    designs?: Array<{
        created_at: string | number | Date;
        id: number;
        spd_file: string | null;
        tanggal: string | null;
        acc_design?: {
            id: number;
            tanggal_kirim: string | null;
            tanggal_acc: string | null;
            status: string;
        };
        design_progres?: DesignProgres[];
    }>;
    sph?: {
        id: number;
        nomor_sph: string | null;
        file: string | null;
        created_at: string;
    };
    spk?: {
        id: number;
        nomor_spk: string | null;
        file: string | null;
        created_at: string;
    };
    list_furnitur?: {
        id: number;
        file: string | null;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
    };
}

export interface TahapDesign {
    id: number;
    nama: string;
}

export interface DesignProgres {
    id: number;
    design_id: number;
    tahap_design_id: number;
    tanggal_selesai: string | null;
    tahap_design?: TahapDesign;
}

export interface ProjectV2Response {
    data: ProjectV2[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface GetProjectsV2Params {
    page?: number;
    search?: string;
    client_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export const projectV2Service = {
    getProjects: async (params?: GetProjectsV2Params) => {
        const { data } = await apiClient.get<ProjectV2Response>('/projects-v2', { params });
        return data;
    },

    getProject: async (id: number) => {
        const { data } = await apiClient.get<ProjectV2>(`/projects-v2/${id}`);
        return data;
    },

    createProject: async (payload: { name: string; client_id: number; description?: string; deadline?: string }) => {
        const { data } = await apiClient.post<ProjectV2>('/projects-v2', payload);
        return data;
    },

    updateProject: async (id: number, payload: { name: string; client_id: number; description?: string; deadline?: string }) => {
        const { data } = await apiClient.put<ProjectV2>(`/projects-v2/${id}`, payload);
        return data;
    },

    deleteProject: async (id: number) => {
        const { data } = await apiClient.delete(`/projects-v2/${id}`);
        return data;
    },

    // Project Items V2
    getProjectItems: async (projectId: number) => {
        const { data } = await apiClient.get<ProjectItemV2[]>(`/projects-v2/${projectId}/items`);
        return data;
    },

    createProjectItemsBulk: async (projectId: number, items: any[]) => {
        const { data } = await apiClient.post<ProjectItemV2[]>(`/projects-v2/${projectId}/items/bulk`, { items });
        return data;
    },

    updateProjectItem: async (id: number, payload: any) => {
        const { data } = await apiClient.put<ProjectItemV2>(`/projects-v2-items/${id}`, payload);
        return data;
    },

    deleteProjectItem: async (id: number) => {
        const { data } = await apiClient.delete(`/projects-v2-items/${id}`);
        return data;
    },

    getMDLItems: async (params?: { search?: string; page?: number; per_page?: number }) => {
        const { data } = await apiClient.get<any>('/mdl', { params });
        return data;
    },

    uploadSPD: async (projectId: number, file: File, tanggal: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tanggal', tanggal);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-spd`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadSPH: async (projectId: number, file: File, nomor_sph: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomor_sph', nomor_sph);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-sph`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    updateAccDesign: async (projectId: number, payload: { tanggal_kirim?: string; tanggal_acc?: string; status: string }) => {
        const { data } = await apiClient.post(`/projects-v2/${projectId}/update-acc-design`, payload);
        return data;
    },

    uploadSPK: async (projectId: number, file: File, nomor_spk: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomor_spk', nomor_spk);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-spk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    getDesignStages: async () => {
        const { data } = await apiClient.get<TahapDesign[]>('/design-stages');
        return data;
    },

    addDesignStage: async (nama: string) => {
        const { data } = await apiClient.post<TahapDesign>('/design-stages', { nama });
        return data;
    },

    getDesignProgress: async (designId: number) => {
        const { data } = await apiClient.get<DesignProgres[]>(`/designs/${designId}/progress`);
        return data;
    },

    updateDesignProgress: async (designId: number, payload: { tahap_design_id: number; tanggal_selesai?: string | null }) => {
        const { data } = await apiClient.post<DesignProgres>(`/designs/${designId}/progress`, payload);
        return data;
    },

    deleteDesignProgress: async (progressId: number) => {
        const { data } = await apiClient.delete(`/design-progress/${progressId}`);
        return data;
    },

    uploadListFurnitur: async (projectId: number, payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) => {
        const formData = new FormData();
        if (payload.file) formData.append('file', payload.file);
        if (payload.tanggal_mulai) formData.append('tanggal_mulai', payload.tanggal_mulai);
        if (payload.tanggal_selesai) formData.append('tanggal_selesai', payload.tanggal_selesai);

        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-list-furnitur`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadGambarKerja: async (itemId: number, payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) => {
        const formData = new FormData();
        if (payload.file) formData.append('file', payload.file);
        if (payload.tanggal_mulai) formData.append('tanggal_mulai', payload.tanggal_mulai);
        if (payload.tanggal_selesai) formData.append('tanggal_selesai', payload.tanggal_selesai);

        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/upload-gambar-kerja`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    getDivisions: async () => {
        const { data } = await apiClient.get<Divisi[]>('/divisi');
        return data;
    },

    createDivisi: async (payload: { nama: string; nama_panjang?: string }) => {
        const { data } = await apiClient.post<Divisi>('/divisi', payload);
        return data;
    },

    updateDivisi: async (id: number, payload: { nama: string; nama_panjang?: string }) => {
        const { data } = await apiClient.put<Divisi>(`/divisi/${id}`, payload);
        return data;
    },

    deleteDivisi: async (id: number) => {
        const { data } = await apiClient.delete(`/divisi/${id}`);
        return data;
    },

    updateProjectItemDivisi: async (itemId: number, divisiId: number) => {
        const { data } = await apiClient.put<ProjectItemV2>(`/projects-v2-items/${itemId}`, { 
            divisi_id: divisiId,
            // we need to send other required fields too if the backend validation requires them
            // but for now let's see if partial update works or if I need to fetch the item first
        });
        return data;
    },

    uploadDokubah: async (itemId: number, payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) => {
        const formData = new FormData();
        if (payload.file) formData.append('file', payload.file);
        if (payload.tanggal_mulai) formData.append('tanggal_mulai', payload.tanggal_mulai);
        if (payload.tanggal_selesai) formData.append('tanggal_selesai', payload.tanggal_selesai);
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/upload-dokubah`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    getPics: async () => {
        const { data } = await apiClient.get<Pic[]>('/pics');
        return data;
    },

    updateBahanBaku: async (itemId: number, payload: { tanggal_menerima_dokubah?: string; ketersediaan_stok?: string; tanggal_keluar?: string; pic_id?: number }) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/bahan-baku`, payload);
        return data;
    }
}

export interface MDLItem {
    id: number;
    kategori_mdl: string;
    sub_kategori: string | null;
    kode_barang: string | null;
    nama_barang: string;
    // other fields omitted for brevity
}

export interface ProjectItemV2 {
    id: number;
    project_id: number;
    mdl_item_id: number | null;
    lantai: string | null;
    ruang: string | null;
    item: string;
    keterangan: string | null;
    volume: number | null;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    satuan: string | null;
    harga: number | null;
    jumlah: number;
    divisi_id: number | null;
    created_at: string;
    updated_at: string;
    gambar_kerja?: {
        id: number;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        file: string | null;
    };
    dokubah?: {
        id: number;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        file: string | null;
    };
    bahan_baku?: BahanBaku;
    divisi?: Divisi;
}

export interface BahanBaku {
    id: number;
    project_item_id: number;
    tanggal_menerima_dokubah: string | null;
    ketersediaan_stok: string | null;
    tanggal_keluar: string | null;
    pic_id: number | null;
    pic?: Pic;
}

export interface Pic {
    id: number;
    nama: string;
    jabatan: string | null;
}

export interface Divisi {
    id: number;
    nama: string;
    nama_panjang: string | null;
    created_at: string;
    updated_at: string;
}
