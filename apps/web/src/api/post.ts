import api from "./axios";

export const signInApi = (data: { email: string; password: string }) => {
  return api.post("/signin", data);
};

export const signUpApi = (data: {
  username: string;
  email: string;
  password: string;
}) => {
  return api.post("/signup", data);
};

export const addEmployee = async (payload: any) => {
  const res = await api.post("/employees", payload, { withCredentials: true });
  return res.data;
};

export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");
  return res.data;
};

export const forgetPassword = async (email: string) => {
  const res = await api.post("auth/forget-password", {
    email,
  });

  return res.data;
};

export const resetPassword = async ({
  token,
  password,
}: {
  token: string;
  password: string;
}) => {
  const res = await api.post(
    `auth/reset-password/${token}`,
    { password }
  );

  return res.data;
};
