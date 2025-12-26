import api from "./axios";
export const updateEmployee = async ({id,payload,}: {
  id: string;
  payload: any;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};