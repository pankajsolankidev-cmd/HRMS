import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";

export const profileService = {
  get: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.PROFILE.BASE);
    return res.data;
  },
};

// Aliases for compatibility
export const getProfile = profileService.get;
