import api from "./axios";

export const updateSalaryStructure = async (id: string, payload: any) => {
  const res = await api.patch(`/salary-structures/${id}`, payload);
  return res.data;
};
