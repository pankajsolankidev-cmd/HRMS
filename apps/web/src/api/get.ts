import api from "./axios";

export const getEmployees = async () => {
  const res = await api.get("/employees");
  return Array.isArray(res.data) ? res.data : [];
};

export const getEmployeeById = async (id: string) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};

export const getComponents = async () => {
  const res = await api.get("/components");
  return res.data; 
};

export const getSystems = async () => {
  const res = await api.get("/systems");
  return res.data;
};

export const getSystemById = async (id: string) => {
  const res = await api.get(`/systems/${id}`);
  return res.data;
};


