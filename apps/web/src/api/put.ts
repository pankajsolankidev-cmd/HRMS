import type { EmployeePayload } from "../pages/Employee/EmployeeForm";
import api from "./axios";
import type { ExpensePayload } from "./post";

export const updateEmployee = async ({
  id,
  payload,
}: {
  id: string;
  payload: EmployeePayload;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};

export const updateComponent = async ({
  id,
  payload,
}: {
  id: string;
  payload: any;
}) => {
  const res = await api.put(`/components/${id}`, payload);
  return res.data;
};

export const updateSystem = async ({
  id,
  payload,
}: {
  id: string;
  payload: {
    name: string;
    description?: string;
    components: string[];
  };
}) => {
  const res = await api.put(`/systems/${id}`, {
    name: payload.name,
    description: payload.description,
    componentIds: payload.components,
  });
  return res.data;
};
export const updateExpense = async (params: {
  id: string;
  payload: ExpensePayload;
}) => {
  const { id, payload } = params;

  const res = await api.put(`/expenses/${id}`, payload);
  return res.data;
};
export const updateProject = async (params: { id: string; payload: any }) => {
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
