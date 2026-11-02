import type {
  CreateDepartmentDto,
  DepartmentEntity,
  UpdateDepartmentDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const departmentService = {
  getAll: async (
    params?: ListQueryParams,
  ): Promise<PaginatedResponse<DepartmentEntity>> => {
    const res = await axiosClient.get<PaginatedResponse<DepartmentEntity>>(
      API_ENDPOINTS.DEPARTMENTS.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId): Promise<DepartmentEntity> => {
    const res = await axiosClient.get<DepartmentEntity>(
      API_ENDPOINTS.DEPARTMENTS.BY_ID(id),
    );
    return res.data;
  },

  create: async (payload: CreateDepartmentDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.DEPARTMENTS.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdateDepartmentDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.DEPARTMENTS.BY_ID(id));
    return res.data;
  },
};

// Aliases for compatibility
export const getDepartments = departmentService.getAll;
export const getDepartmentById = departmentService.getById;
export const addDepartment = departmentService.create;
export const updateDepartment = (id: ResourceId, payload: UpdateDepartmentDto) =>
  departmentService.update(id, payload);
export const deleteDepartment = (id: ResourceId) =>
  departmentService.delete(id);
