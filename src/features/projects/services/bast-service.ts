import { axiosInstance as apiClient } from '@/lib/axios';

export interface BastItem {
  id: number;
  project_id: number;
  no_surat: string;
  date: string;
  file_path: string;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectBastRow {
  id: number;
  name: string;
  client?: {
    id: number;
    name: string;
  } | null;
  marketing?: {
    id: number;
    name: string;
  } | null;
  spk?: {
    id: number;
    project_id: number;
    nomor_spk: string | null;
    nominal: number | string | null;
    nominal_dpp?: number | string | null;
    ppn?: number | string | null;
    tanggal_spk?: string | null;
    tanggal_masuk?: string | null;
    file?: string | null;
    spk_signed_file?: string | null;
    created_at?: string;
  } | null;
  progres_kerja?: {
    id: number;
    project_id: number;
    pengiriman: number;
  } | null;
  basts?: BastItem[];
}

export interface BastStats {
  total_spk: number;
  wajib_bast: number;
  bast_uploaded: number;
  bast_pending: number;
  tanpa_bast: number;
  pengiriman_selesai: number;
}

export interface BastListParams {
  page?: number;
  per_page?: number;
  search?: string;
  marketing_id?: number | string;
  status_bast?: 'all' | 'uploaded' | 'pending' | 'tanpa_bast' | string;
  pengiriman?: 'all' | 'completed' | 'in_progress' | 'not_started' | string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedBastResponse {
  current_page: number;
  data: ProjectBastRow[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export const bastService = {
  getBastRekap: async (params?: BastListParams) => {
    const { data } = await apiClient.get<PaginatedBastResponse>('/bast-rekap', {
      params,
    });
    return data;
  },

  getBastStats: async (params?: { marketing_id?: number | string }) => {
    const { data } = await apiClient.get<BastStats>('/bast-rekap/stats', {
      params,
    });
    return data;
  },

  uploadBast: async (
    projectId: number,
    payload: {
      no_surat: string;
      date: string;
      file?: File | null;
    }
  ) => {
    const formData = new FormData();
    formData.append('no_surat', payload.no_surat);
    formData.append('date', payload.date);
    if (payload.file) {
      formData.append('file', payload.file);
    }

    const { data } = await apiClient.post<{ message: string; data?: any }>(
      `/projects/${projectId}/basts`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};
