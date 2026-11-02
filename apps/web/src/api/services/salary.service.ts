import type {
  CreateSalaryDto,
  SalaryStructureEntity,
  UpdateSalaryDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const salaryService = {
  getAll: async (
    params?: ListQueryParams,
  ): Promise<PaginatedResponse<SalaryStructureEntity>> => {
    const res = await axiosClient.get<PaginatedResponse<SalaryStructureEntity>>(
      API_ENDPOINTS.SALARY.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId): Promise<SalaryStructureEntity> => {
    const res = await axiosClient.get<SalaryStructureEntity>(
      API_ENDPOINTS.SALARY.BY_ID(id),
    );
    return res.data;
  },

  create: async (payload: CreateSalaryDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.SALARY.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdateSalaryDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.SALARY.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
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
