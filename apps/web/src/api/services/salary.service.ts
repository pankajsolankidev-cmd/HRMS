import type { CreateSalaryDto, UpdateSalaryDto } from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const salaryService = {
  getAll: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.SALARY.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: string) => {
    const res = await axiosClient.get(API_ENDPOINTS.SALARY.BY_ID(id));
    return res.data;
  },

  create: async (payload: CreateSalaryDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.SALARY.BASE, payload);
    return res.data;
  },

  update: async (id: string, payload: UpdateSalaryDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.SALARY.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosClient.delete(API_ENDPOINTS.SALARY.BY_ID(id));
    return res.data;
  },
};

// Aliases for compatibility
export const getSalaryStructures = salaryService.getAll;
export const getSalaryStructureById = salaryService.getById;
export const addSalaryStructure = salaryService.create;
export const updateSalaryStructure = salaryService.update;
export const deleteSalaryStructure = salaryService.delete;
