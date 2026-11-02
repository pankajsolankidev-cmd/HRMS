import type {
  PayrollEntity,
  PayrollSummaryDto,
  ProcessPayrollDto,
  UpdatePayrollDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { PaginatedResponse } from "../types";

export const payrollService = {
  getPreview: async (params?: { month?: string; year?: number }) => {
    const res = await axiosClient.get(API_ENDPOINTS.PAYROLL.BULK_PREVIEW, {
      params,
    });
    return res.data;
  },

  getHistory: async <T = PayrollEntity>(params?: {
    employeeId?: string;
  }): Promise<PaginatedResponse<T>> => {
    const res = await axiosClient.get<PaginatedResponse<T>>(
      API_ENDPOINTS.PAYROLL.BASE,
      { params },
    );
    return res.data;
  },

  getSummary: async (month: string, year: number): Promise<PayrollSummaryDto> => {
    const res = await axiosClient.get<PayrollSummaryDto>(
      API_ENDPOINTS.PAYROLL.SUMMARY,
      { params: { month, year } },
    );
    return res.data;
  },

  processBulk: async (payload: ProcessPayrollDto[] | any) => {
    const res = await axiosClient.post(
      API_ENDPOINTS.PAYROLL.BULK_PROCESS,
      payload,
    );
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdatePayrollDto | any) => {
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
