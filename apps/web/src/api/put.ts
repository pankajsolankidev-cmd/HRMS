import type {
  UpdateEmployeeDto,
  UpdateExpenseDto,
  UpdateProjectDto,
  UpdateSystemDto,
} from "@shared/types";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";
import api from "./axios";

export const updateEmployee = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateEmployeeDto;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};

export const updateComponent = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateComponentDto;
}) => {
  const res = await api.put(`/components/${id}`, payload);
  return res.data;
};

export const updateSystem = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateSystemDto;
}) => {
  const res = await api.put(`/systems/${id}`, payload);
  return res.data;
};

export const updateExpense = async (params: {
  id: string;
  payload: UpdateExpenseDto;
}) => {
  const { id, payload } = params;
  const res = await api.put(`/expenses/${id}`, payload);
  return res.data;
};

export const updateProject = async (params: {
  id: string;
  payload: UpdateProjectDto;
}) => {
  const { id, payload } = params;
  const res = await api.put(`/projects/${id}`, payload);
  return res.data;
};

export const updateDepartment = async (
  id: string,
  payload: { name: string },
) => {
  const res = await api.put(`/departments/${id}`, payload);
  return res.data;
};

export const updatePublicHoliday = async (id: string, payload: any) => {
  const res = await api.put(`/holidays/${id}`, payload);
  return res.data;
};
