import api from "./axios";

export const getEmployees = async () => {
  const res = await api.get("/employees");
  return Array.isArray(res.data) ? res.data : [];
};

export const getEmployeeById = async (id: string) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};