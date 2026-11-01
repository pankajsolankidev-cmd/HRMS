import type { CreateOrganizationDto } from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";

export const organizationService = {
  get: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.ORGANIZATION.BASE);
    return res.data;
  },

  create: async (payload: CreateOrganizationDto) => {
    const res = await axiosClient.post(
      API_ENDPOINTS.ORGANIZATION.BASE,
      payload,
    );
    return res.data;
  },
};

// Aliases for compatibility
export const getOrganization = organizationService.get;
export const addOrganization = organizationService.create;
