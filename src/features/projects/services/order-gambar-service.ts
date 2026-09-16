import { axiosInstance as apiClient } from '@/lib/axios';

export interface OrderGambarItem {
  id: number;
  project_id: number;
  user_id: number;
  file: string | null;
  target_selesai: string | null;
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Ditolak' | string;
  created_at: string;
  updated_at: string;
  tertanda_tangan_lengkap?: number;
  pakai_gambar?: number;
  no_order?: string | null;
  jenis_order?: string | null; // 1: Desain Interior, 2: Desain Furnitur, 3: Gambar Kerja
  detail_pekerjaan?: string | null;
  prioritas?: string | null; // 1: Biasa, 2: Mendesak
  catatan_pengirim?: string | null;
  tanggal_order?: string | null;
  penerima_id?: number | null;
  tanggal_diterima?: string | null;
  catatan_penerima?: string | null;
  deleted_at?: string | null;
  user?: {
    id: number;
    name: string;
  } | null;
  penerima?: {
    id: number;
    name: string;
  } | null;
  project?: {
    id: number;
    nama_projek: string;
    no_spk?: string | null;
    status?: string;
    client?: {
      id: number;
      nama: string;
    } | null;
    marketing?: {
      id: number;
      name: string;
    } | null;
  } | null;
}

export interface OrderGambarStats {
  total: number;
  pending: number;
  diproses: number;
  selesai: number;
  mendesak: number;
}

export interface OrderGambarListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  prioritas?: string;
  jenis_order?: string;
  pakai_gambar?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export const orderGambarService = {
  getOrderGambarList: async (params?: OrderGambarListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<OrderGambarItem>>(
      '/order-gambar-kerja',
      { params }
    );
    return data;
  },

  getOrderGambarStats: async () => {
    const { data } = await apiClient.get<OrderGambarStats>('/order-gambar-kerja/stats');
    return data;
  },

  terimaOrder: async (id: number) => {
    const { data } = await apiClient.post(`/order-gambar-kerja/${id}/terima`);
    return data;
  },

  updateOrderStatus: async (
    id: number,
    payload: {
      status: string;
      catatan_penerima?: string;
    }
  ) => {
    const { data } = await apiClient.post(
      `/order-gambar-kerja/${id}/update-status`,
      payload
    );
    return data;
  },
};
