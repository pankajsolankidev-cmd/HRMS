import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";
import type {
  AddLeavePayload,
  ListQueryParams,
  PaginatedResponse,
  UpdateEmployeeLeavePayload,
  UpdateLeavePayload,
} from "../types";

export const leaveService = {
  getAll: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.LEAVES.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: string) => {
    const res = await axiosClient.get(API_ENDPOINTS.LEAVES.BY_ID(id));
    return res.data?.data ?? res.data;
  },

  getManualById: async (id: string) => {
    const res = await axiosClient.get(API_ENDPOINTS.LEAVES.MANUAL_BY_ID(id));
    return res.data?.data ?? res.data;
  },

  create: async (payload: AddLeavePayload) => {
    const res = await axiosClient.post(API_ENDPOINTS.LEAVES.BASE, payload);
    return res.data;
  },

  createManual: async (payload: AddLeavePayload & { employeeId: string }) => {
    const res = await axiosClient.post(API_ENDPOINTS.LEAVES.MANUAL, payload);
    return res.data?.message ?? res.data;
  },

  update: async (id: string, payload: UpdateLeavePayload) => {
    const res = await axiosClient.patch(API_ENDPOINTS.LEAVES.BY_ID(id), payload);
    return res.data;
  },

  updateManual: async (id: string, payload: UpdateEmployeeLeavePayload) => {
    const res = await axiosClient.patch(
      API_ENDPOINTS.LEAVES.MANUAL_BY_ID(id),
      payload,
    );
    return res.data;
  },

  approve: async (id: string) => {
    const res = await axiosClient.patch(API_ENDPOINTS.LEAVES.APPROVE(id));
    return res.data;
  },

  reject: async (id: string, rejectionReason?: string) => {
    const res = await axiosClient.patch(API_ENDPOINTS.LEAVES.REJECT(id), {
      rejectionReason,
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosClient.delete(API_ENDPOINTS.LEAVES.BY_ID(id));
    return res.data;
  },

  deleteManual: async (id: string) => {
    const res = await axiosClient.delete(API_ENDPOINTS.LEAVES.MANUAL_BY_ID(id));
    return res.data;
  },

  downloadFile: async (id: string) => {
    const res = await axiosClient.get(API_ENDPOINTS.LEAVES.DOWNLOAD(id), {
      responseType: "blob",
    });
    return res.data;
  },
};

// Aliases for compatibility
export const getLeaves = leaveService.getAll;
export const getLeaveById = leaveService.getById;
export const getManualLeaveById = leaveService.getManualById;
export const addLeave = leaveService.create;
export const addEmployeeLeave = leaveService.createManual;
export const updateLeave = ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateLeavePayload;
}) => leaveService.update(id, payload);
export const updateEmployeeLeave = ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateEmployeeLeavePayload;
}) => leaveService.updateManual(id, payload);
export const approveLeave = leaveService.approve;
export const rejectLeave = ({
  id,
  rejectionReason,
}: {
  id: string;
  rejectionReason?: string;
}) => leaveService.reject(id, rejectionReason);
export const deleteLeave = leaveService.delete;
export const deleteManualLeave = leaveService.deleteManual;
export const downloadLeaveFile = leaveService.downloadFile;
export type { AddLeavePayload };
