import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";

export const fileService = {
  upload: async (file: File): Promise<{ fileName?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosClient.post<{ fileName?: string }>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },
};

// Aliases for compatibility
export const uploadFile = fileService.upload;
