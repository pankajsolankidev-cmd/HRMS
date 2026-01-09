import api from "./axios";

export const updateSalaryStructure = async (id: string, payload: any) => {
  const res = await api.patch(`/salary/${id}`, payload);
  return res.data;
};

export const updatePayroll = async (
  id: string, 
  payload: {
    employeeId: string;
    month: string;
    year: number;
    totalDeductions: number;
  }
) => {
  const res = await api.patch(`/payrolls/${id}`, payload);
  return res.data;
};