import { axiosInstance as apiClient } from '@/lib/axios';
import { KopSurat } from '@/features/master-data/services/kop-surat-service';

export interface UserSignature {
  id: number;
  user_id: number;
  file: string;
  file_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DrawingItemDetail {
  id: number;
  project_id: number;
  project_name?: string;
  item: string;
  satuan: string;
  jumlah: number;
  client_name: string;
  nomor_spk: string;
  tanggal_spk_masuk?: string | null;
  tanggal_selesai: string | null;
  tanggal_submit?: string | null;
  file_gambar_kerja: string | null;
}

export interface SuratSerahTerimaDetailItem {
  id: number;
  surat_serah_terima_gambar_id: number;
  project_item_id: number;
  keterangan?: string | null;
  project_item?: {
    id: number;
    project_id: number;
    item: string;
    satuan: string;
    jumlah: number;
    project?: {
      id: number;
      name?: string;
      client?: {
        id: number;
        name: string;
      } | null;
      spk?: {
        id: number;
        nomor_spk: string | null;
      } | null;
    } | null;
    gambar_kerja?: {
      id: number;
      file: string | null;
      tanggal_selesai: string | null;
      updated_at?: string;
    } | null;
  } | null;
}

export interface SuratSerahTerimaItem {
  id: number;
  nomor_surat: string;
  kop_surat_id: number | null;
  tanggal: string;
  pengirim_id: number;
  tanggal_kirim: string | null;
  penerima_id: number | null;
  tanggal_terima: string | null;
  status: 'draft' | 'menunggu_approval' | 'diterima' | 'ditolak';
  catatan: string | null;
  created_at: string;
  updated_at: string;
  kop_surat?: KopSurat | null;
  pengirim?: {
    id: number;
    name: string;
    email?: string;
    tanda_tangan?: UserSignature | null;
  } | null;
  penerima?: {
    id: number;
    name: string;
    email?: string;
    tanda_tangan?: UserSignature | null;
  } | null;
  items: SuratSerahTerimaDetailItem[];
}

export interface SuratSerahTerimaStats {
  total: number;
  hari_ini: number;
  menunggu_approval: number;
  diterima: number;
}

export interface SuratSerahTerimaListParams {
  page?: number;
  per_page?: number;
  tanggal?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  search?: string;
}

export interface PaginatedSuratResponse {
  current_page: number;
  data: SuratSerahTerimaItem[];
  last_page: number;
  per_page: number;
  total: number;
  stats: SuratSerahTerimaStats;
}

export const suratSerahTerimaService = {
  getList: async (params?: SuratSerahTerimaListParams) => {
    const { data } = await apiClient.get<PaginatedSuratResponse>(
      '/surat-serah-terima-gambar',
      { params }
    );
    return data;
  },

  getAvailableItems: async (params?: {
    tanggal?: string;
    filter_tanggal?: string;
    search?: string;
    exclude_surat_id?: number;
  }) => {
    const { data } = await apiClient.get<{ items: DrawingItemDetail[] }>(
      '/surat-serah-terima-gambar/available-items',
      { params }
    );
    return data.items;
  },

  getDetail: async (id: number) => {
    const { data } = await apiClient.get<{ data: SuratSerahTerimaItem }>(
      `/surat-serah-terima-gambar/${id}`
    );
    return data.data;
  },

  create: async (payload: {
    tanggal: string;
    nomor_surat?: string;
    kop_surat_id?: number | null;
    item_ids: number[];
    catatan?: string;
    langsung_kirim?: boolean;
  }) => {
    const { data } = await apiClient.post<{
      message: string;
      data: SuratSerahTerimaItem;
    }>('/surat-serah-terima-gambar', payload);
    return data;
  },

  update: async (
    id: number,
    payload: {
      tanggal: string;
      nomor_surat: string;
      kop_surat_id?: number | null;
      item_ids: number[];
      catatan?: string;
    }
  ) => {
    const { data } = await apiClient.put<{
      message: string;
      data: SuratSerahTerimaItem;
    }>(`/surat-serah-terima-gambar/${id}`, payload);
    return data;
  },

  submit: async (id: number) => {
    const { data } = await apiClient.post<{
      message: string;
      data: SuratSerahTerimaItem;
    }>(`/surat-serah-terima-gambar/${id}/submit`);
    return data;
  },

  approve: async (id: number, payload?: { catatan?: string }) => {
    const { data } = await apiClient.post<{
      message: string;
      data: SuratSerahTerimaItem;
    }>(`/surat-serah-terima-gambar/${id}/approve`, payload);
    return data;
  },

  reject: async (id: number, payload: { catatan: string }) => {
    const { data } = await apiClient.post<{
      message: string;
      data: SuratSerahTerimaItem;
    }>(`/surat-serah-terima-gambar/${id}/reject`, payload);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/surat-serah-terima-gambar/${id}`
    );
    return data;
  },

  // Tanda Tangan API
  getMySignature: async () => {
    const { data } = await apiClient.get<{
      signature: UserSignature | null;
      file_url: string | null;
    }>('/tanda-tangan/my-signature');
    return data;
  },

  uploadSignature: async (fileOrBase64: File | string) => {
    if (typeof fileOrBase64 === 'string') {
      const { data } = await apiClient.post<{
        message: string;
        signature: UserSignature;
        file_url: string;
      }>('/tanda-tangan/upload', {
        signature_base64: fileOrBase64,
      });
      return data;
    } else {
      const formData = new FormData();
      formData.append('file', fileOrBase64);
      const { data } = await apiClient.post<{
        message: string;
        signature: UserSignature;
        file_url: string;
      }>('/tanda-tangan/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
  },
};
