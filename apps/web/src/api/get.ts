import api from "./axios";
import type { ListQueryParams, PaginatedResponse } from "./types";

export const getEmployees = async () => {
  const res = await api.get("/employees");
  return Array.isArray(res.data) ? res.data : [];
};

export const getEmployeeById = async (id: string) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};

export const getComponents = async () => {
  const res = await api.get("/components");
  return Array.isArray(res.data) ? res.data : [];
};

export const getComponentById = async (id: string) => {
  const res = await api.get(`/components/${id}`);
  return res.data;
};

export const getSystems = async () => {
  const res = await api.get("/systems");
  return Array.isArray(res.data) ? res.data : [];
};

export const getSystemById = async (id: string) => {
  const res = await api.get(`/systems/${id}`);
  return res.data;
};

export const getSalaryStructures = async () => {
  const res = await api.get("/salary");
  return Array.isArray(res.data) ? res.data : [];
};

export const getSalaryStructureById = async (id: string) => {
  const res = await api.get(`/salary/${id}`);
  return res.data;
};
export const getPayrolls = async () => {
  const res = await api.get("/payrolls");
  return Array.isArray(res.data) ? res.data : [];
};

export const getPayrollById = async (id: string) => {
  const res = await api.get(`/payrolls/${id}`);
  return res.data;
};

export const getPayrollsByMonthYear = async (month: string, year: number) => {
  const res = await api.get("/payrolls", {
    params: {
      month: month,
      year: String(year),
    },
  });

  return Array.isArray(res.data) ? res.data : [];
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

export const getExpenses = async (params: ListQueryParams) => {
  const res = await api.get<PaginatedResponse<any>>("/expenses", { params });

  return res.data;
};
export const getExpenseById = async (id: string) => {
  const res = await api.get(`/expenses/${id}`);
  return res.data;
};
export const getExpenseSummary = async (month: number, year: number) => {
  const res = await api.get("/expenses/summary", {
    params: { month, year },
  });
  return res.data;
};
