import api from "./axios";
import type { ListQueryParams, PaginatedResponse } from "./types";

export const getEmployees = async (params: ListQueryParams) => {
  const res = await api.get<PaginatedResponse<any>>("/employees", { params });

  return res.data;
};

export const getEmployeeById = async (id: string) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};

export const getComponents = async (params: ListQueryParams) => {
  const res = await api.get("/components", {
    params,
  });

  return res.data;
};

export const getComponentById = async (id: string) => {
  const res = await api.get(`/components/${id}`);
  return res.data;
};

export const getSystems = async (params: ListQueryParams) => {
  const res = await api.get<PaginatedResponse<any>>("/systems", { params });
  return res.data;
};

export const getSystemById = async (id: string) => {
  const res = await api.get(`/systems/${id}`);
  return res.data;
};

export const getSalaryStructures = async (params: ListQueryParams) => {
  const res = await api.get<PaginatedResponse<any>>("/salary-structures", {
    params,
  });
  return res.data;
};

export const getSalaryStructureById = async (id: string) => {
  const res = await api.get(`/salary/${id}`);
  return res.data;
};
export type GetPayrollParams = ListQueryParams & {
  month?: string;
  year?: number;
};

export const getPayrolls = async (params: GetPayrollParams) => {
  const res = await api.get<PaginatedResponse<any>>("/payrolls", { params });

  return res.data;
};

export const getPayrollById = async (id: string) => {
  const res = await api.get(`/payrolls/${id}`);
  return res.data;
};

export const getPayrollSummary = async (month: string, year: number) => {
  const res = await api.get("/payrolls/summary", {
    params: { month, year },
  });
  console.log(res.data);
  return res.data as {
    employeesProcessed: number;
    avgSalary: number;
    netPayroll: number;
  };
};

export const getLeaves = async () => {
  const res = await api.get("/leave-requests/me");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};
export const getLeaveById = async (id: string) => {
  const res = await api.get(`/leave-requests/${id}`);
  return res.data?.data ?? res.data;
};
