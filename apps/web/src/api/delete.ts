import api from "./axios";

export const deleteEmployee = async (id: number) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};

export const deleteComponent = async (id: number) => {
  const res = await api.delete(`/components/${id}`);
  return res.data;
};

export const deleteSystem = async (id: number) => {
  const res = await api.delete(`/systems/${id}`);
  return res.data;
};

export const deleteSalaryStructure = async (id: string) => {
  const res = await api.delete(`/salary/${id}`);
  return res.data;
};

export const deletePayroll = async (id: number) => {
  const res = await api.delete(`/payrolls/${id}`);
  return res.data;
};

export const deleteLeave = async (id: string) => {
  const res = await api.delete(`/leave-requests/${id}`);
  return res.data;
};
export const deleteManualLeave = async (id: string) => {
  const res = await api.delete(`/leave-requests/manual/${id}`);
  return res.data;
};

export const deleteExpense = async (id: number) => {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
};
export const deleteProject = async (id: number) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
};

export const removeEmployeeFromProject = async (params: { projectId: string; employeeId: string }) => {
  const res = await api.delete(`/projects/${params.projectId}/employees/${params.employeeId}`);
  return res.data;
};
