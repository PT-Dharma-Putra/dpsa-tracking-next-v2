import { axiosInstance as apiClient } from '@/lib/axios';

export interface ProjectV2 {
    id: number;
    name: string;
    description: string | null;
    spk_number: string | null;
    client_id: number;
    deadline: string | null;
    status: string;
    need_design: number;
    progres_produksi?: number;
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
        target_selesai: string | null;
        acc_design?: {
            id: number;
            tanggal_kirim: string | null;
            tanggal_acc: string | null;
            status: string;
            bukti_acc?: string | null;
        };
        studio_id: number | null;
        studio?: {
            id: number;
            name: string;
        };
        design_progres?: DesignProgres[];
    }>;
    sph?: {
        id: number;
        nomor_sph?: string;
        file: string | null;
        created_at: string;
    };
    spk?: {
        id: number;
        nomor_spk?: string;
        file: string | null;
        created_at: string;
    };
    list_furnitur?: {
        id: number;
        file: string | null;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
    };
    jadwal_pengiriman?: JadwalPengiriman;
}

export interface TahapDesign {
    id: number;
    nama: string;
}

export interface DesignProgres {
    id: number;
    design_id: number;
    tahap_design_id: number;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    file: string | null;
    catatan: string | null;
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

    createProject: async (payload: { name: string; client_id: number; description?: string; deadline?: string; need_design?: number }) => {
        const { data } = await apiClient.post<ProjectV2>('/projects-v2', payload);
        return data;
    },

    updateProject: async (id: number, payload: { name: string; client_id: number; description?: string; deadline?: string; need_design?: number }) => {
        const { data } = await apiClient.put<ProjectV2>(`/projects-v2/${id}`, payload);
        return data;
    },

    deleteProject: async (id: number) => {
        const { data } = await apiClient.delete(`/projects-v2/${id}`);
        return data;
    },

    updatePic: async (projectId: number, studioId: number) => {
        const { data } = await apiClient.post(`/projects-v2/${projectId}/update-pic`, {
            studio_id: studioId
        });
        return data;
    },

    getDesigners: async () => {
        const { data } = await apiClient.get<Array<{ id: number, name: string }>>('/designers');
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

    getMDLItems: async (params?: { search?: string; kategori?: string; lokasi_ruangan?: string; min_price?: number; max_price?: number; page?: number; per_page?: number }) => {
        const { data } = await apiClient.get<any>('/mdl', { params });
        return data;
    },

    getMDLCategories: async () => {
        const { data } = await apiClient.get<string[]>('/mdl/categories');
        return data;
    },

    getMDLLocations: async () => {
        const { data } = await apiClient.get<string[]>('/mdl/locations');
        return data;
    },

    uploadSPD: async (projectId: number, file: File, target_selesai: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_selesai', target_selesai);
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

    updateAccDesign: async (projectId: number, payload: { tanggal_kirim?: string; tanggal_acc?: string; status: string; bukti_acc?: File | null }) => {
        const formData = new FormData();
        if (payload.tanggal_kirim) formData.append('tanggal_kirim', payload.tanggal_kirim);
        if (payload.tanggal_acc) formData.append('tanggal_acc', payload.tanggal_acc);
        formData.append('status', payload.status);
        if (payload.bukti_acc) formData.append('bukti_acc', payload.bukti_acc);

        const { data } = await apiClient.post(`/projects-v2/${projectId}/update-acc-design`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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

    updateDesignProgress: async (designId: number, payload: { 
        tahap_design_id: number; 
        tanggal_mulai?: string | null;
        tanggal_selesai?: string | null;
        catatan?: string | null;
        file?: File | null;
    }) => {
        const formData = new FormData();
        formData.append('tahap_design_id', payload.tahap_design_id.toString());
        if (payload.tanggal_mulai) formData.append('tanggal_mulai', payload.tanggal_mulai);
        if (payload.tanggal_selesai) formData.append('tanggal_selesai', payload.tanggal_selesai);
        if (payload.catatan) formData.append('catatan', payload.catatan);
        if (payload.file) formData.append('file', payload.file);

        const { data } = await apiClient.post<DesignProgres>(`/designs/${designId}/progress`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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
    },

    updateProduksi: async (itemId: number, payload: any) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/produksi`, payload);
        return data;
    },

    updateBarangJadiMasuk: async (itemId: number, payload: { tanggal: string; jumlah: number }) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/barang-jadi-masuk`, payload);
        return data;
    },

    // Shipment Methods
    getTahapPengiriman: async () => {
        const { data } = await apiClient.get('/tahap-pengiriman');
        return data;
    },
    createTahapPengiriman: async (nama: string) => {
        const { data } = await apiClient.post('/tahap-pengiriman', { nama });
        return data;
    },
    updateTahapPengiriman: async (id: number, nama: string) => {
        const { data } = await apiClient.put(`/tahap-pengiriman/${id}`, { nama });
        return data;
    },
    deleteTahapPengiriman: async (id: number) => {
        const { data } = await apiClient.delete(`/tahap-pengiriman/${id}`);
        return data;
    },
    getItemDetail: async (itemId: number) => {
        const { data } = await apiClient.get(`/project-item-detail/${itemId}`);
        return data;
    },
    storeBarangJadiKeluar: async (itemId: number, payload: any) => {
        const { data } = await apiClient.post(`/project-item/${itemId}/barang-jadi-keluar`, payload);
        return data;
    },
    updateBarangJadiKeluar: async (id: number, payload: any) => {
        const { data } = await apiClient.put(`/barang-jadi-keluar/${id}`, payload);
        return data;
    },
    deleteBarangJadiKeluar: async (id: number) => {
        const { data } = await apiClient.delete(`/barang-jadi-keluar/${id}`);
        return data;
    },
    storeSuratJalan: async (itemId: number, payload: FormData) => {
        const { data } = await apiClient.post(`/project-item/${itemId}/surat-jalan`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    updateSuratJalan: async (id: number, payload: FormData) => {
        const { data } = await apiClient.post(`/surat-jalan/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    deleteSuratJalan: async (id: number) => {
        const { data } = await apiClient.delete(`/surat-jalan/${id}`);
        return data;
    },
    storeSetrimKembali: async (itemId: number, payload: FormData) => {
        const { data } = await apiClient.post(`/project-item/${itemId}/setrim-kembali`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    updateSetrimKembali: async (id: number, payload: FormData) => {
        const { data } = await apiClient.post(`/setrim-kembali/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    deleteSetrimKembali: async (id: number) => {
        const { data } = await apiClient.delete(`/setrim-kembali/${id}`);
        return data;
    },
    storeSetting: async (itemId: number, payload: any) => {
        const { data } = await apiClient.post(`/project-item/${itemId}/setting`, payload);
        return data;
    },
    updateSetting: async (id: number, payload: any) => {
        const { data } = await apiClient.put(`/setting/${id}`, payload);
        return data;
    },
    deleteSetting: async (id: number) => {
        const { data } = await apiClient.delete(`/setting/${id}`);
        return data;
    },

    // Delivery Schedule
    getTanggalPengiriman: async () => {
        const { data } = await apiClient.get<TanggalPengiriman[]>('/tanggal-pengiriman');
        return data;
    },
    storeTanggalPengiriman: async (tanggal: string) => {
        const { data } = await apiClient.post<TanggalPengiriman>('/tanggal-pengiriman', { tanggal });
        return data;
    },
    getJadwalPengiriman: async (params?: { tanggal_pengiriman_id?: number }) => {
        const { data } = await apiClient.get<JadwalPengiriman[]>('/jadwal-pengiriman', { params });
        return data;
    },
    storeJadwalPengiriman: async (payload: { project_id: number; tanggal_pengiriman_id: number; keterangan?: string }) => {
        const { data } = await apiClient.post<JadwalPengiriman>('/jadwal-pengiriman', payload);
        return data;
    },
    deleteJadwalPengiriman: async (id: number) => {
        const { data } = await apiClient.delete(`/jadwal-pengiriman/${id}`);
        return data;
    }
}

export interface MDLItem {
    id: number;
    kategori_mdl: string;
    sub_kategori: string | null;
    kode_barang: string | null;
    nama_barang: string;
    lokasi_ruangan: string | null;
    spesifikasi_dan_material: string | null;
    dimensi_panjang: number | null;
    dimensi_lebar: number | null;
    dimensi_tinggi: number | null;
    volume: number | null;
    kode_satuan_beli: string | null;
}

export interface ProjectItemV2 {
    id: number;
    project_id: number;
    mdl_item_id: number | null;
    mdl_item?: MDLItem;
    lantai: string | null;
    ruang?: string;
    item: string;
    keterangan?: string;
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
    produksi?: Produksi;
    barang_jadi_masuk?: BarangJadiMasuk[];
    barang_jadi_keluar?: BarangJadiKeluar[];
    surat_jalan?: SuratJalan[];
    setrim_kembali?: SetrimKembali[];
    setting?: Setting[];
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

export interface Produksi {
    id: number;
    project_item_id: number;
    jumlah_order: number;
    cold_press: number;
    running_saw: number;
    edging: number;
    cnc: number;
    tukang_kayu: number;
    tukang_jok: number;
    finishing: number;
    rakit: number;
    quality_control: number;
    packing: number;
    persen: number;
}

export interface BarangJadiMasuk {
    id: number;
    project_item_id: number;
    tanggal: string;
    jumlah: number;
    created_at: string;
    updated_at: string;
}

export interface TahapPengiriman {
    id: number;
    nama: string;
}

export interface BarangJadiKeluar {
    id: number;
    project_item_id: number;
    tahap_pengiriman_id: number;
    tanggal: string;
    jumlah: number;
    tahap_pengiriman?: TahapPengiriman;
}

export interface SuratJalan {
    id: number;
    project_item_id: number;
    tahap_pengiriman_id: number;
    tanggal: string;
    file: string | null;
    tahap_pengiriman?: TahapPengiriman;
}

export interface SetrimKembali {
    id: number;
    project_item_id: number;
    tahap_pengiriman_id: number;
    tanggal: string;
    file: string | null;
    tahap_pengiriman?: TahapPengiriman;
}

export interface Setting {
    id: number;
    project_item_id: number;
    tahap_pengiriman_id: number;
    tanggal_mulai: string;
    jumlah: number;
    koor_setting: string | null;
    tanggal_selesai: string | null;
    tahap_pengiriman?: TahapPengiriman;
}

export interface TanggalPengiriman {
    id: number;
    tanggal: string;
    created_at: string;
    updated_at: string;
}

export interface JadwalPengiriman {
    id: number;
    project_id: number;
    tanggal_pengiriman_id: number;
    keterangan: string | null;
    project?: ProjectV2;
    tanggal_pengiriman?: TanggalPengiriman;
    created_at: string;
    updated_at: string;
}
