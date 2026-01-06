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
  dayType: "full_day" | "first_half" | "second_half";
  reason: string;
  file?: string;
};

export const addLeave = async (payload: AddLeavePayload) => {
  const res = await api.post("/leave-requests", payload);
  return res.data;
};



