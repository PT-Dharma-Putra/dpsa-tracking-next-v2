import { axiosInstance as apiClient } from "@/lib/axios";

export interface DetailPengiriman {
  id?: number;
  pengiriman_id?: number;
  spk_id?: number | null;
  project_item_id: number;
  jumlah_keluar: number;
  jumlah_tersetting: number;
  keterangan?: string | null;
  project_item?: {
    id: number;
    item: string;
    jumlah: number;
    lantai?: string | null;
    ruang?: string | null;
    panjang?: number | null;
    lebar?: number | null;
    tinggi?: number | null;
    volume?: number | null;
    satuan?: string | null;
    project?: {
      id: number;
      name: string;
      spk_number?: string | null;
    };
  };
}

export interface Pengiriman {
  id: number;
  tanggal: string;
  client_id: number;
  surat_jalan?: string | null;
  setrim?: string | null;
  tanggal_mulai_setting?: string | null;
  tanggal_selesai_setting?: string | null;
  koor_setting?: string | null;
  no_kendaraan?: string | null;
  supir?: string | null;
  created_at?: string;
  details?: DetailPengiriman[];
  details_count?: number;
  client?: {
    id: number;
    name: string;
    address?: string | null;
  };
}

export interface ProjectItemWithShipmentStats {
  id: number;
  item: string;
  jumlah: number;
  project_id: number;
  project?: {
    id: number;
    name: string;
  };
  jumlah_keluar_total: number;
  jumlah_tersetting_total: number;
  spk_number?: string | null;
}

export const PengirimanService = {
  getPengiriman: async (params?: {
    page?: number;
    search?: string;
    client_id?: string;
    spk_id?: number | string;
    per_page?: number;
  }): Promise<{ data: Pengiriman[]; current_page: number; last_page: number; total: number }> => {
    const response = await apiClient.get("/pengiriman", { params });
    // Laravel paginated response returns { data, current_page, last_page, total }
    return response.data;
  },

  getPengirimanById: async (id: number): Promise<Pengiriman> => {
    const response = await apiClient.get(`/pengiriman/${id}`);
    return response.data;
  },

  createPengiriman: async (data: Omit<Pengiriman, "id"> & { details: Omit<DetailPengiriman, "id">[] }): Promise<Pengiriman> => {
    const response = await apiClient.post("/pengiriman", data);
    return response.data;
  },

  updatePengiriman: async (id: number, data: Partial<Pengiriman> & { details: Omit<DetailPengiriman, "id">[] }): Promise<Pengiriman> => {
    const response = await apiClient.put(`/pengiriman/${id}`, data);
    return response.data;
  },

  deletePengiriman: async (id: number): Promise<void> => {
    await apiClient.delete(`/pengiriman/${id}`);
  },

  updateSuratJalan: async (id: number, file: File): Promise<Pengiriman> => {
    const formData = new FormData();
    formData.append('surat_jalan', file);
    const response = await apiClient.post(`/pengiriman/${id}/surat-jalan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateSetrim: async (id: number, file: File): Promise<Pengiriman> => {
    const formData = new FormData();
    formData.append('setrim', file);
    const response = await apiClient.post(`/pengiriman/${id}/setrim`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getClientProjectItems: async (clientId: number): Promise<ProjectItemWithShipmentStats[]> => {
    const response = await apiClient.get(`/clients/${clientId}/project-items`);
    return response.data;
  },
};
