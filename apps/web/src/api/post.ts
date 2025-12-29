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
