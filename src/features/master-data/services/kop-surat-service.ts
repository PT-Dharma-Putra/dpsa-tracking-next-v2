import { axiosInstance as apiClient } from '@/lib/axios';

export interface KopSurat {
  id: number;
  nama_kop: string;
  divisi_id?: number | null;
  logo?: string | null;
  nama_perusahaan: string;
  jenis_usaha?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  nama_identitas_iso?: string | null;
  nomor_identitas_iso?: string | null;
  revisi_ke?: string | null;
  terbit?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  divisi?: {
    id: number;
    nama: string;
  } | null;
}

export const kopSuratService = {
  getActiveKopSurat: async (divisiId?: number): Promise<KopSurat | null> => {
    const params = divisiId ? { divisi_id: divisiId } : {};
    const { data } = await apiClient.get<{ data: KopSurat | null }>('/kop-surat/active', { params });
    return data.data;
  },

  getKopSuratList: async (params?: { divisi_id?: number; divisi_ids?: string }): Promise<KopSurat[]> => {
    const { data } = await apiClient.get<{ data: KopSurat[] }>('/kop-surat', {
      params: { per_page: -1, ...params },
    });
    return data.data;
  },

  getKopSuratById: async (id: number): Promise<KopSurat> => {
    const { data } = await apiClient.get<{ data: KopSurat }>(`/kop-surat/${id}`);
    return data.data;
  },

  createKopSurat: async (payload: Partial<KopSurat>): Promise<KopSurat> => {
    const { data } = await apiClient.post<{ data: KopSurat }>('/kop-surat', payload);
    return data.data;
  },

  updateKopSurat: async (id: number, payload: Partial<KopSurat>): Promise<KopSurat> => {
    const { data } = await apiClient.put<{ data: KopSurat }>(`/kop-surat/${id}`, payload);
    return data.data;
  },

  deleteKopSurat: async (id: number): Promise<void> => {
    await apiClient.delete(`/kop-surat/${id}`);
  },

  setActiveKopSurat: async (id: number): Promise<KopSurat> => {
    const { data } = await apiClient.post<{ data: KopSurat }>(`/kop-surat/${id}/set-active`);
    return data.data;
  },
};
