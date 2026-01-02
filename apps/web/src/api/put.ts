import type { EmployeePayload } from "../pages/Employee/AddEditEmpForm";
import api from "./axios";

export const updateEmployee = async ({
  id,
  payload,
}: {
  id: string;
  payload: EmployeePayload;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};
