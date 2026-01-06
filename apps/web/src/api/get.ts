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
  return Array.isArray(res.data) ? res.data : [];
};

export const getComponentById = async (id: string) => {
  const res = await api.get(`/components/${id}`);
  return res.data;
};

export const getSystems = async () => {
  const res = await api.get("/systems");
  return Array.isArray(res.data) ? res.data : [];
};

export const getSystemById = async (id: string) => {
  const res = await api.get(`/systems/${id}`);
  return res.data;
};

export const getLeaves = async () => {
  const res = await api.get("/leave-requests/me");
   console.log("LEAVES API RESPONSE 👉", res.data);
  return Array.isArray(res.data?.data) ? res.data.data : [];

}
export const getLeaveById = async (id:string) => {
  const res = await api.get(`/leaves/${id}`);
  return res.data;
}
