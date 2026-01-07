import type { EmployeePayload } from "../pages/Employee/AddEditEmpForm";
import api from "./axios";

export const signInApi = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/signin", data);
  return res.data;
};

export const signUpApi = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/signup", data);
  return res.data;
};

export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");
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

export const addEmployee = async (payload: EmployeePayload) => {
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
  const res = await api.post("/salary-structures", payload);
  return res.data;
};