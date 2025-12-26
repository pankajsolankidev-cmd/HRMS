import api from "./axios";

export const getEmployees = async () => {
  const res = await api.get("/employees");

  // ✅ API returns ARRAY directly
  return Array.isArray(res.data) ? res.data : [];
};
