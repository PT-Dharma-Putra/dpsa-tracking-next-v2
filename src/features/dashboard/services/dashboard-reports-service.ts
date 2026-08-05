import { axiosInstance } from "@/lib/axios";

export const getReportsData = async (params?: { client_id?: string; month?: string; year?: string }) => {
  const response = await axiosInstance.get('/dashboard/reports', { params });
  return response.data;
};
