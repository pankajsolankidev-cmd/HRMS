import api from "./axios";

export const deleteEmployee = async (id: number) => {
  const res = await api.delete("/employees/" + id);
  return res.data;
};

export const deleteComponent = async (id: number) => {
  const res = await api.delete("/components/" + id);
  return res.data;
};