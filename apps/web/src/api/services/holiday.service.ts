import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const holidayService = {
  getAll: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.HOLIDAYS.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId) => {
    const res = await axiosClient.get(API_ENDPOINTS.HOLIDAYS.BY_ID(id));
    return res.data;
  },

  create: async (payload: any) => {
    const res = await axiosClient.post(API_ENDPOINTS.HOLIDAYS.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: any) => {
    const res = await axiosClient.put(API_ENDPOINTS.HOLIDAYS.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.HOLIDAYS.BY_ID(id));
    return res.data;
  },

  exportPDF: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.HOLIDAYS.EXPORT_PDF, {
      responseType: "blob",
    });
    return res.data;
  },

  downloadTemplate: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.HOLIDAYS.UPLOAD_TEMPLATE, {
      responseType: "blob",
    });
    return res.data;
  },

  previewImport: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosClient.post(
      API_ENDPOINTS.HOLIDAYS.CHECK_IMPORT,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  confirmImport: async (holidays: any[]) => {
    const res = await axiosClient.post(API_ENDPOINTS.HOLIDAYS.CONFIRM_IMPORT, {
      holidays,
    });
    return res.data;
  },
};

// Aliases for compatibility
export const getPublicHolidays = holidayService.getAll;
export const getPublicHolidayById = holidayService.getById;
export const addPublicHoliday = holidayService.create;
export const updatePublicHoliday = (id: ResourceId, payload: any) =>
  holidayService.update(id, payload);
export const deletePublicHoliday = (id: ResourceId) =>
  holidayService.delete(id);
export const exportPublicHolidayPDF = holidayService.exportPDF;
export const downloadHolidayTemplate = holidayService.downloadTemplate;
export const previewHolidayImport = holidayService.previewImport;
export const confirmHolidayImport = holidayService.confirmImport;
