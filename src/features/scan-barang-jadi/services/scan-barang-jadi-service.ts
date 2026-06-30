import { axiosInstance as apiClient } from '@/lib/axios';

export interface BarangJadiMasukRecord {
  id: number;
  project_item_id: number;
  tanggal: string;
  jumlah: number;
  file_setrim: string | null;
  created_at: string;
}

export interface ProjectItemDetail {
  id: number;
  item: string;
  lantai: string | null;
  ruang: string | null;
  jumlah: number;
  satuan: string | null;
  project_id: number;
  project: {
    id: number;
    name: string;
    spk_number: string | null;
  } | null;
  barang_jadi_masuk: BarangJadiMasukRecord[];
}

export const ScanBarangJadiService = {
  getItemDetail: async (id: string | number): Promise<ProjectItemDetail> => {
    const response = await apiClient.get(`/project-item-detail/${id}`);
    return response.data;
  },

  submitBarangJadiMasuk: async (
    itemId: number,
    data: { tanggal: string; jumlah: number; file_setrim?: File | null }
  ): Promise<{ data: BarangJadiMasukRecord }> => {
    const formData = new FormData();
    formData.append('tanggal', data.tanggal);
    formData.append('jumlah', data.jumlah.toString());
    if (data.file_setrim) {
      formData.append('file_setrim', data.file_setrim);
    }
    const response = await apiClient.post(
      `/projects-v2-items/${itemId}/barang-jadi-masuk`,
      formData
    );
    return response.data;
  },

  deleteBarangJadiMasuk: async (recordId: number): Promise<void> => {
    await apiClient.delete(`/barang-jadi-masuk/${recordId}`);
  },
};
