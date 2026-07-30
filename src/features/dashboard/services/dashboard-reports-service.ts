import { axiosInstance } from "@/lib/axios";

export const getReportsData = async () => {
  const response = await axiosInstance.get('/dashboard/reports');
  return response.data;
};
