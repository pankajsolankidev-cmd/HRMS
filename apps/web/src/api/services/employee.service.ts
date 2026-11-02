import type {
  CreateEmployeeDto,
  EmployeeEntity,
  UpdateEmployeeDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const employeeService = {
  getAll: async (
    params?: ListQueryParams,
  ): Promise<PaginatedResponse<EmployeeEntity>> => {
    const res = await axiosClient.get<PaginatedResponse<EmployeeEntity>>(
      API_ENDPOINTS.EMPLOYEES.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId): Promise<EmployeeEntity> => {
    const res = await axiosClient.get<EmployeeEntity>(
      API_ENDPOINTS.EMPLOYEES.BY_ID(id),
    );
    return res.data;
  },

  create: async (payload: CreateEmployeeDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.EMPLOYEES.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdateEmployeeDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.EMPLOYEES.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
    return res.data;
  },
};

// Aliases for compatibility
export const getEmployees = employeeService.getAll;
export const getEmployeeById = employeeService.getById;
export const addEmployee = employeeService.create;
export const updateEmployee = async ({
  id,
  payload,
}: {
  id: ResourceId;
  payload: UpdateEmployeeDto;
}) => employeeService.update(id, payload);
export const deleteEmployee = (id: ResourceId) => employeeService.delete(id);
