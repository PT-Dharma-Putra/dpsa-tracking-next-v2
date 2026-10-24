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

export interface AvailableProject {
  id: number;
  name: string;
  nomor_spk: string;
  client_name: string;
  total_items_count: number;
  active_orders_count: number;
}

export interface AvailableOrderItem {
  id: number;
  project_id: number;
  project_name?: string;
  client_name?: string;
  nomor_spk?: string;
  tanggal_spk_masuk?: string | null;
  item: string;
  ruang: string;
  satuan: string;
  total_project_qty: number;
  already_ordered_qty: number;
  remaining_qty: number;
  stok_gudang: number;
  file_gambar_kerja: string | null;
}

export interface OrderPekerjaanProduksiDetailItem {
  id: number;
  order_pekerjaan_produksi_id: number;
  project_item_id: number;
  ruang?: string | null;
  jumlah: number;
  stock: number;
  produksi: number;
  keterangan?: string | null;
  project_item?: {
    id: number;
    project_id: number;
    item: string;
    ruang?: string | null;
    satuan: string;
    jumlah: number;
    stok_gudang?: number;
    gambar_kerja?: {
      id: number;
      file: string | null;
      tanggal_selesai: string | null;
      updated_at?: string;
    } | null;
  } | null;
}

export interface OrderPekerjaanProduksiData {
  id: number;
  nomor_order: string;
  project_id: number;
  kop_surat_id: number | null;
  tanggal_order: string;
  jenis_order: 'normal' | 'mendesak';
  target_penyelesaian: string | null;
  lampiran_dokubah: boolean;
  lampiran_gambar_kerja: boolean;
  lampiran_data_stock: boolean;
  lampiran_jadwal_produksi: boolean;
  catatan: string | null;
  status: 'draft' | 'menunggu_diterima' | 'diterima' | 'dibatalkan';
  pembuat_id: number;
  tanggal_diserahkan: string | null;
  penerima_id: number | null;
  tanggal_diterima: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: number;
    name: string;
    client?: {
      id: number;
      name: string;
    } | null;
    spk?: {
      id: number;
      nomor_spk: string | null;
    } | null;
  } | null;
  kop_surat?: KopSurat | null;
  pembuat?: {
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
  items: OrderPekerjaanProduksiDetailItem[];
}

export interface OrderPekerjaanProduksiStats {
  total: number;
  draft: number;
  menunggu_diterima: number;
  diterima: number;
  mendesak: number;
}

export interface OrderPekerjaanProduksiParams {
  page?: number;
  per_page?: number;
  status?: string;
  project_id?: number;
  jenis_order?: string;
  search?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}

export interface PaginatedOrderPekerjaanProduksiResponse {
  current_page: number;
  data: OrderPekerjaanProduksiData[];
  last_page: number;
  per_page: number;
  total: number;
  stats: OrderPekerjaanProduksiStats;
}

export interface OrderItemInput {
  project_item_id: number;
  ruang?: string;
  jumlah: number;
  stock: number;
  produksi: number;
  keterangan?: string;
}

export interface CreateOrderPayload {
  project_id: number;
  tanggal_order: string;
  nomor_order?: string;
  kop_surat_id?: number | null;
  jenis_order: 'normal' | 'mendesak';
  target_penyelesaian?: string | null;
  lampiran_dokubah?: boolean;
  lampiran_gambar_kerja?: boolean;
  lampiran_data_stock?: boolean;
  lampiran_jadwal_produksi?: boolean;
  catatan?: string;
  langsung_kirim?: boolean;
  items: OrderItemInput[];
}

export interface UpdateOrderPayload {
  tanggal_order: string;
  nomor_order: string;
  kop_surat_id?: number | null;
  jenis_order: 'normal' | 'mendesak';
  target_penyelesaian?: string | null;
  lampiran_dokubah?: boolean;
  lampiran_gambar_kerja?: boolean;
  lampiran_data_stock?: boolean;
  lampiran_jadwal_produksi?: boolean;
  catatan?: string;
  items: OrderItemInput[];
}

export const orderPekerjaanProduksiService = {
  getList: async (params?: OrderPekerjaanProduksiParams) => {
    const { data } = await apiClient.get<PaginatedOrderPekerjaanProduksiResponse>(
      '/order-pekerjaan-produksi',
      { params }
    );
    return data;
  },

  getAvailableProjects: async () => {
    const { data } = await apiClient.get<{ projects: AvailableProject[] }>(
      '/order-pekerjaan-produksi/available-projects'
    );
    return data.projects;
  },

  getAvailableItems: async (projectId?: number | null, excludeOrderId?: number) => {
    const url = projectId
      ? `/order-pekerjaan-produksi/available-items/${projectId}`
      : '/order-pekerjaan-produksi/available-items';
    const { data } = await apiClient.get<{ items: AvailableOrderItem[] }>(url, {
      params: { exclude_order_id: excludeOrderId },
    });
    return data.items;
  },

  generateNumber: async (tanggal?: string) => {
    const { data } = await apiClient.get<{ nomor_order: string }>(
      '/order-pekerjaan-produksi/generate-number',
      { params: { tanggal } }
    );
    return data.nomor_order;
  },

  getDetail: async (id: number) => {
    const { data } = await apiClient.get<{ data: OrderPekerjaanProduksiData }>(
      `/order-pekerjaan-produksi/${id}`
    );
    return data.data;
  },

  create: async (payload: CreateOrderPayload) => {
    const { data } = await apiClient.post<{
      message: string;
      data: OrderPekerjaanProduksiData;
    }>('/order-pekerjaan-produksi', payload);
    return data;
  },

  update: async (id: number, payload: UpdateOrderPayload) => {
    const { data } = await apiClient.put<{
      message: string;
      data: OrderPekerjaanProduksiData;
    }>(`/order-pekerjaan-produksi/${id}`, payload);
    return data;
  },

  submit: async (id: number) => {
    const { data } = await apiClient.post<{
      message: string;
      data: OrderPekerjaanProduksiData;
    }>(`/order-pekerjaan-produksi/${id}/submit`);
    return data;
  },

  terima: async (id: number, payload?: { catatan?: string }) => {
    const { data } = await apiClient.post<{
      message: string;
      data: OrderPekerjaanProduksiData;
    }>(`/order-pekerjaan-produksi/${id}/terima`, payload);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/order-pekerjaan-produksi/${id}`
    );
    return data;
  },
};
