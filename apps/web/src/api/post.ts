import Cookies from "js-cookie";
import api, { refreshApi } from "./axios";

export const signInApi = async (data: { email: string; password: string }) => {
  const res = await api.post("/signin", data);
  return res.data;
};

export const logoutUser = async (refreshToken: string) => {
  const res = await api.post("/auth/logout", {
    refreshToken,
  });
  return res.data;
};
export const refreshToken = async () => {
  const refreshToken = Cookies.get("refresh");

  const res = await refreshApi.post("/auth/refresh", {
    refreshToken,
  });

  return res.data;
};

export const forgetPassword = async (email: string) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (params: {
  key: string;
  newPassword: string;
}) => {
  const { key, newPassword } = params;

  const res = await api.post("/auth/reset-password", {
    key,
    newPassword,
  });

  return res.data;
};

export const addEmployee = async (payload: any) => {
  const res = await api.post("/employees", payload);
  return res.data;
};

export const addComponent = async (payload: {
  name: string;
  description: string;
  code: string;
}) => {
  const res = await api.post("/components", payload);
  return res.data;
};

export const addSystem = async (payload: {
  name: string;
  description: string;
  components: string[];
}) => {
  const res = await api.post("/systems", {
    name: payload.name,
    description: payload.description,
    componentIds: payload.components,
  });
  return res.data;
};

export const addSalaryStructure = async (payload: any) => {
  const res = await api.post("/salary", payload);
  return res.data;
};

export const processBulkPayroll = async (payload: any) => {
  const { data } = await api.post("/payrolls/bulk/process", payload);
  return data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data as {
    path?: string;
    url?: string;
  };
};

export type AddLeavePayload = {
  fromDate: string;
  toDate: string;
  type: "sick" | "casual" | "marriage" | "wfh";
  dayType: "full_day" | "first_half" | "second_half" | "multiple_days";
  reason: string;
  file?: string;
  fromHour: number;
  toHour: number;
};

export const addLeave = async (payload: AddLeavePayload) => {
  const res = await api.post("/leave-requests", payload);
  return res.data;
};
export const addEmployeeLeave = async (
  payload: AddLeavePayload & { employeeId: string },
) => {
  const res = await api.post("/leave-requests/manual", payload);
  return res.data.message;
};
export type ExpensePayload = {
  expense_type: string;
  amount: number;
  expense_date: string;
  description?: string;
  file?: string;
};

export const addExpense = async (payload: ExpensePayload) => {
  const res = await api.post("/expenses", payload);
  return res.data;
};
export const addProject = async (payload: any) => {
  const res = await api.post("/projects", payload);
  return res.data;
};
