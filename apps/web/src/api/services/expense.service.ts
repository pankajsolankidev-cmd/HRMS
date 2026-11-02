import type {
  CreateExpenseDto,
  ExpenseEntity,
  UpdateExpenseDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const expenseService = {
  getAll: async <T = any>(
    params: ListQueryParams,
  ): Promise<PaginatedResponse<T>> => {
    const res = await axiosClient.get<PaginatedResponse<T>>(
      API_ENDPOINTS.EXPENSES.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId): Promise<ExpenseEntity> => {
    const res = await axiosClient.get<ExpenseEntity>(
      API_ENDPOINTS.EXPENSES.BY_ID(id),
    );
    return res.data;
  },

  getSummary: async (fromDate: string, toDate: string) => {
    const res = await axiosClient.get(API_ENDPOINTS.EXPENSES.SUMMARY, {
      params: { fromDate, toDate },
    });
    return res.data;
  },

  create: async (payload: CreateExpenseDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.EXPENSES.CREATE, payload);
    return res.data;
  },

  createDraft: async (payload: CreateExpenseDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.EXPENSES.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdateExpenseDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.EXPENSES.BY_ID(id), payload);
    return res.data;
  },

  approve: async (id: ResourceId) => {
    const res = await axiosClient.patch(API_ENDPOINTS.EXPENSES.APPROVE(id));
    return res.data;
  },

  reject: async (id: ResourceId, reason?: string) => {
    const res = await axiosClient.patch(API_ENDPOINTS.EXPENSES.REJECT(id), {
      reason,
    });
    return res.data;
  },

  submit: async (id: ResourceId) => {
    const res = await axiosClient.patch(API_ENDPOINTS.EXPENSES.SUBMIT(id));
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.EXPENSES.BY_ID(id));
    return res.data;
  },

  downloadFile: async (id: ResourceId) => {
    const res = await axiosClient.get(API_ENDPOINTS.EXPENSES.DOWNLOAD(id), {
      responseType: "blob",
    });
    return res.data;
  },
};

// Aliases for compatibility
export const getExpenses = expenseService.getAll;
export const getExpenseById = expenseService.getById;
export const getExpenseSummary = expenseService.getSummary;
export const addExpense = expenseService.create;
export const addExpenseDraft = expenseService.createDraft;
export const updateExpense = (params: { id: ResourceId; payload: UpdateExpenseDto }) =>
  expenseService.update(params.id, params.payload);
export const approveExpense = expenseService.approve;
export const rejectExpense = (params: { id: ResourceId; reason?: string }) =>
  expenseService.reject(params.id, params.reason);
export const createExpense = expenseService.submit;
export const deleteExpense = expenseService.delete;
export const downloadExpenseFile = expenseService.downloadFile;
