import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const notificationService = {
  getAll: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.NOTIFICATIONS.BASE,
      { params },
    );
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await axiosClient.get<{ count: number }>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    );
    return res.data.count;
  },

  markAsRead: async (id: string) => {
    const res = await axiosClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
    );
    return res.data;
  },
};

// Aliases for compatibility
export const getNotifications = notificationService.getAll;
export const getUnreadCount = notificationService.getUnreadCount;
export const markNotificationRead = notificationService.markAsRead;
export const markAllNotificationsRead = notificationService.markAllAsRead;
