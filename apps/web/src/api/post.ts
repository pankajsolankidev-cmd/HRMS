import api from "./axios";

export const signInApi = (data: {
  email: string;
  password: string;
}) => api.post("/signin", data);

export const signUpApi = (data: {
  username: string;
  email: string;
  password: string;
}) => api.post("/signup", data);

export const addEmployee = async (payload: any) => {
  const res = await api.post("/employees", payload);
  return res.data;
};
