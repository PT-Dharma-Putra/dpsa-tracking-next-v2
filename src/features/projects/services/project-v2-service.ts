import { axiosInstance as apiClient } from '@/lib/axios';

export interface ProjectV2 {
    id: number;
    name: string;
    description: string | null;
    note_engineer: string | null;
    prioritas: 'Normal' | 'Urgent' | null;
    spk_number: string | null;
    client_id: number;
    deadline: string | null;
    tanggal_selesai?: string | null;
    status: string;
    need_design: number;
    drawing_progress?: number;
    latest_drawing_submit?: string | null;
    progres_produksi?: number;
    client?: {
        id: number;
        name: string;
    };
    marketing?: {
        id: number;
        name: string;
    } | null;
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
    sphs?: Array<{
        id: number;
        nomor_sph?: string;
        nominal?: string;
        file: string | null;
        status: string;
        note_revision: string | null;
        created_at: string;
    }>;
    sph?: {
        id: number;
        nomor_sph?: string;
        nominal?: string;
        file: string | null;
        status: string;
        note_revision: string | null;
        created_at: string;
    };
    spk?: {
        id: number;
        nomor_spk?: string;
        nominal?: string | number | null;
        deadline?: string | null;
        file: string | null;
        spk_signed_file: string | null;
        spk_status: string | null;
        tanggal_masuk: string | null;
        created_at: string;
    };
    list_furnitur?: {
        id: number;
        file: string | null;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        updated_at: string;
    };
    jadwal_pengiriman?: JadwalPengiriman;
    order_gambar_kerja?: Array<{
        id: number;
        file: string | null;
        target_selesai: string | null;
        status: string;
        created_at: string;
        tertanda_tangan_lengkap?: number;
    }>;
    order_produksi?: Array<{
        id: number;
        file: string | null;
        target_selesai: string | null;
        status: string;
        created_at: string;
    }>;
    penagihans?: Array<{
        id: number;
        persentase: number;
        status: string;
    }>;
    file_pendukung_spd?: Array<{
        id: number;
        file: string;
    }>;
    progres_kerja?: ProgresKerja;
    dokubah?: {
        id: number;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        file: string | null;
        file_rekap_dokubah: string | null;
    };
}

export interface ProgresKerja {
    id: number;
    project_id: number;
    po_divisi: number;
    tanggal_update_po_divisi: string | null;
    gambar_kerja: number;
    tanggal_update_gambar_kerja: string | null;
    dokubah: number;
    tanggal_update_dokubah: string | null;
    stok_material: number;
    tanggal_update_stok_material: string | null;
    produksi: number;
    tanggal_update_produksi: string | null;
    gudang_barang_jadi: number;
    tanggal_update_gudang_barang_jadi: string | null;
    pengiriman: number;
    tanggal_update_pengiriman: string | null;
    total: number;
    created_at: string;
    updated_at: string;
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
    month?: string;
    year?: string;
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

    createProject: async (payload: { name: string; client_id: number; description?: string; deadline?: string; tanggal_selesai?: string | null; need_design?: number }) => {
        const { data } = await apiClient.post<ProjectV2>('/projects-v2', payload);
        return data;
    },

    updateProject: async (id: number, payload: { name: string; client_id: number; description?: string; deadline?: string; tanggal_selesai?: string | null; need_design?: number }) => {
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

    updateNote: async (projectId: number, note: string) => {
        const { data } = await apiClient.post(`/projects-v2/${projectId}/update-note`, {
            note_engineer: note
        });
        return data;
    },

    getDesigners: async () => {
        const { data } = await apiClient.get<Array<{ id: number, name: string }>>('/designers');
        return data;
    },

    createDesigner: async (payload: { name: string; email: string; divisi_id: number }) => {
        const { data } = await apiClient.post<any>('/designers', payload);
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
    
    getItemHistory: async (id: number) => {
        const { data } = await apiClient.get<any[]>(`/projects-v2-items/${id}/history`);
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

    uploadSPD: async (projectId: number, file: File, target_selesai: string, filePendukung?: File[]) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_selesai', target_selesai);
        if (filePendukung && filePendukung.length > 0) {
            filePendukung.forEach((f) => {
                formData.append('file_pendukung[]', f);
            });
        }
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-spd`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadSPH: async (projectId: number | string, file: File, nomor_sph: string, nominal?: number | string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomor_sph', nomor_sph);
        if (nominal) formData.append('nominal', nominal.toString());
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-sph`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    approveSPH: async (projectId: number | string) => {
        const { data } = await apiClient.post(`/projects-v2/${projectId}/approve-sph`);
        return data;
    },

    rejectSPH: async (projectId: number | string, reason: string) => {
        const { data } = await apiClient.post(`/projects-v2/${projectId}/reject-sph`, { reason });
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

    uploadSPK: async (projectId: number, file: File, nomor_spk: string, deadline?: string, prioritas?: string, tanggal_masuk?: string, nominal?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomor_spk', nomor_spk);
        if (deadline) formData.append('deadline', deadline);
        if (prioritas) formData.append('prioritas', prioritas);
        if (tanggal_masuk) formData.append('tanggal_masuk', tanggal_masuk);
        if (nominal) formData.append('nominal', nominal);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-spk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    approveSPK: async (projectId: number, file: File, deadline?: string, tanggal_masuk?: string, nominal?: string) => {
        const formData = new FormData();
        formData.append('spk_signed_file', file);
        if (deadline) formData.append('deadline', deadline);
        if (tanggal_masuk) formData.append('tanggal_masuk', tanggal_masuk);
        if (nominal) formData.append('nominal', nominal);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/approve-spk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadOrderGambarKerja: async (projectId: number, file: File, target_selesai: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_selesai', target_selesai);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-order-gambar-kerja`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadSignedOrderGambarKerja: async (projectId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-signed-order-gambar-kerja`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    uploadOrderProduksi: async (projectId: number, file: File, target_selesai: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_selesai', target_selesai);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-order-produksi`, formData, {
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

    uploadGambarKerja: async (itemId: number, payload: { file?: File | string; tanggal_mulai?: string; tanggal_selesai?: string }) => {
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
        const { data } = await apiClient.post<ProjectItemV2>(`/projects-v2-items/${itemId}`, { 
            divisi_id: divisiId,
            _method: 'PUT'
        });
        return data;
    },

    uploadDokubah: async (projectId: number, payload: { file?: File | string; file_rekap_dokubah?: File | string; tanggal_mulai?: string; tanggal_selesai?: string }) => {
        const formData = new FormData();
        if (payload.file) formData.append('file', payload.file);
        if (payload.file_rekap_dokubah) formData.append('file_rekap_dokubah', payload.file_rekap_dokubah);
        if (payload.tanggal_mulai) formData.append('tanggal_mulai', payload.tanggal_mulai);
        if (payload.tanggal_selesai) formData.append('tanggal_selesai', payload.tanggal_selesai);
        const { data } = await apiClient.post(`/projects-v2/${projectId}/upload-dokubah`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    updateProjectItemPic: async (itemId: number, picId: number) => {
        const { data } = await apiClient.post<ProjectItemV2>(`/projects-v2-items/${itemId}`, { 
            pic_engineer_id: picId,
            _method: 'PUT'
        });
        return data;
    },

    getPics: async () => {
        const { data } = await apiClient.get<Pic[]>('/pics');
        return data;
    },

    updateBahanBaku: async (itemId: number, payload: { 
        tanggal_menerima_dokubah?: string; 
        ketersediaan_stok?: string; 
        tanggal_keluar?: string; 
        pic_id?: number;
        new_pic_name?: string;
        new_pic_jabatan?: string;
    }) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/bahan-baku`, payload);
        return data;
    },

    updateProduksi: async (itemId: number, payload: any) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/produksi`, payload);
        return data;
    },

    updateBarangJadiMasuk: async (itemId: number, payload: { tanggal: string; jumlah: number; file?: File | null }) => {
        const formData = new FormData();
        formData.append('tanggal', payload.tanggal);
        formData.append('jumlah', payload.jumlah.toString());
        if (payload.file) formData.append('file_setrim', payload.file);

        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/barang-jadi-masuk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    updateBarangJadiTerpacking: async (itemId: number, payload: { tanggal: string; jumlah: number }) => {
        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/barang-jadi-terpacking`, payload);
        return data;
    },

    updateQcCek: async (itemId: number, payload: { qty: number; repair: number; pass: number; afkir: number; status: string; file?: File | null }) => {
        const formData = new FormData();
        formData.append('qty', payload.qty.toString());
        formData.append('repair', payload.repair.toString());
        formData.append('pass', payload.pass.toString());
        formData.append('afkir', payload.afkir.toString());
        formData.append('status', payload.status);
        if (payload.file) formData.append('file', payload.file);

        const { data } = await apiClient.post(`/projects-v2-items/${itemId}/qc-cek`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    // Shipment Methods
    getTahapPengiriman: async (projectId?: number) => {
        const { data } = await apiClient.get('/tahap-pengiriman', {
            params: { project_id: projectId }
        });
        return data;
    },
    createTahapPengiriman: async (nama: string, projectId: number) => {
        const { data } = await apiClient.post('/tahap-pengiriman', { nama, project_id: projectId });
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
    link_gambar_kerja: string | null;
}

export interface ProjectItemV2 {
    id: number;
    project_id: number;
    mdl_item_id: number | null;
    mdl_item?: MDLItem;
    lantai: string | null;
    ruang?: string;
    lokasi?: string;
    material_utama?: string;
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
    pic_engineer_id: number | null;
    custom: boolean;
    created_at: string;
    updated_at: string;
    gambar_kerja?: {
        id: number;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        file: string | null;
    };
    bahan_baku?: BahanBaku;
    produksi?: Produksi;
    barang_jadi_masuk?: BarangJadiMasuk[];
    barang_jadi_terpacking?: BarangJadiTerpacking[];
    barang_jadi_keluar?: BarangJadiKeluar[];
    surat_jalan?: SuratJalan[];
    setrim_kembali?: SetrimKembali[];
    setting?: Setting[];
    divisi?: Divisi;
    pic_engineer?: {
        id: number;
        name: string;
    };
    history_count?: number;
    history_fields?: string[];
    qc_cek?: QcCek;
}

export interface QcCek {
    id: number;
    project_item_id: number;
    qty: number;
    repair: number;
    pass: number;
    afkir: number;
    persen: number;
    status: string;
    file: string | null;
    created_at: string;
    updated_at: string;
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
    menggunakan_stok?: number;
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
    skipped_fields?: string[];
}

export interface BarangJadiMasuk {
    id: number;
    project_item_id: number;
    tanggal: string;
    jumlah: number;
    file_setrim: string | null;
    created_at: string;
    updated_at: string;
}

export interface BarangJadiTerpacking {
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
