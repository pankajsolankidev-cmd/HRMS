import api from "./axios";

export const updateSalaryStructure = async (id: string, payload: any) => {
  const res = await api.put(`/salary/${id}`, payload);
  return res.data;
};

export const updatePayroll = async (id: string, payload: any) => {
  const res = await api.patch(`/payrolls/${id}`, payload);
  return res.data;
};

export const updateLeave = async ({
  id,
  payload,
}: {
  id: string;
  payload: {
    fromDate: string;
    toDate: string;
    type: "sick" | "casual" | "marriage" | "wfh";
    dayType: "full_day" | "first_half" | "second_half" | "multiple_days";
    reason: string;
    fromHour: number;
    toHour: number;
    file?: string;
  };
}) => {
  const res = await api.patch(`/leave-requests/${id}`, payload);
  return res.data;
};
export const updateEmployeeLeave = async ({
  id,
  payload,
}: {
  id: string;
  payload: {
    employeeId: string;
    fromDate: string;
    toDate: string;
    type: "sick" | "casual" | "marriage" | "wfh";
    dayType: "full_day" | "first_half" | "second_half" | "multiple_days";
    reason: string;
    fromHour: number;
    toHour: number;
    file?: string;
  };
}) => {
  const res = await api.patch(`/leave-requests/manual/${id}`, payload);
  return res.data;
};
export const approveLeave = async (id: string) => {
  const res = await api.patch(`/leave-requests/${id}/approve`);
  return res.data;
};

export const rejectLeave = async ({
  id,
  rejectionReason,
}: {
  id: string;
  rejectionReason?: string;
}) => {
  const res = await api.patch(`/leave-requests/${id}/reject`, {
    rejectionReason,
  });
  return res.data;
};

export const approveExpense = async (id: number) => {
  const res = await api.patch(`/expenses/${id}/approve`);
  return res.data;
};

export const rejectExpense = async ({
  id,
  reason,
}: {
  id: number;
  reason?: string;
}) => {
  const res = await api.patch(`/expenses/${id}/reject`, { reason });
  return res.data;
};
export const createExpense = async (id: number) => {
  const res = await api.patch(`/expenses/${id}/create`);
  return res.data;
};
export const markNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  await api.patch("/notifications/read-all");
};
