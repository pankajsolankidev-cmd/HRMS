import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";

export type PayrollSummaryResponse = {
  employeesProcessed: number;
  avgSalary: number;
  netPayroll: number;
};

export const payrollService = {
  getPreview: async (params?: { month?: string; year?: number }) => {
    const res = await axiosClient.get(API_ENDPOINTS.PAYROLL.BULK_PREVIEW, {
      params,
    });
    return res.data;
  },

  getHistory: async (params?: { employeeId?: string }) => {
    const res = await axiosClient.get(API_ENDPOINTS.PAYROLL.BASE, { params });
    return res.data;
  },

  getSummary: async (month: string, year: number): Promise<PayrollSummaryResponse> => {
    const res = await axiosClient.get<PayrollSummaryResponse>(
      API_ENDPOINTS.PAYROLL.SUMMARY,
      { params: { month, year } },
    );
    return res.data;
  },

  processBulk: async (payload: any) => {
    const res = await axiosClient.post(API_ENDPOINTS.PAYROLL.BULK_PROCESS, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: any) => {
    const res = await axiosClient.patch(API_ENDPOINTS.PAYROLL.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.PAYROLL.BY_ID(id));
    return res.data;
  },
};

// Aliases for compatibility
export const getPayrollPreview = payrollService.getPreview;
export const getEmployeePayrollHistory = payrollService.getHistory;
export const getPayrollSummary = payrollService.getSummary;
export const processBulkPayroll = payrollService.processBulk;
export const updatePayroll = payrollService.update;
export const deletePayroll = (id: ResourceId) => payrollService.delete(id);
