import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS } from "../endpoints";

export const dashboardService = {
  getAdminDashboard: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_SUMMARY);
    return res.data;
  },

  getEmployeeDashboard: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.DASHBOARD.EMPLOYEE_SUMMARY);
    return res.data;
  },
};

// Aliases for compatibility
export const getDashboard = dashboardService.getAdminDashboard;
export const getEmployeeDashboard = dashboardService.getEmployeeDashboard;
