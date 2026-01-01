import api from "./axios";

export const deleteEmployee = async (id: number) => {
  const res = await api.delete("/employees/" + id);
  return res.data;
};

export const deleteSystem = async (id: number) => {
  return api.delete(`/systems/${id}`);
};