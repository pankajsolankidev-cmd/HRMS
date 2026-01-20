import api from "./axios";

export const updateSalaryStructure = async (id: string, payload: any) => {
  const res = await api.patch(`/salary/${id}`, payload);
  return res.data;
};

export const updatePayroll = async (
  id: string,
  payload: {
    employeeId: string;
    month: string;
    year: number;
    totalDeductions: number;
  }
) => {
  const res = await api.patch(`/payrolls/${id}`, payload);
  return res.data;
};

export const updateLeave = async ({
  id,
  payload,
}: {
  id: string;
  payload: {
    fromDate: string;
    toDate: string;
    type: "sick" | "casual" | "marriage" | "wfh";
    dayType: "full_day" | "first_half" | "second_half";
    reason: string;
  };
}) => {
  const res = await api.patch(`/leave-requests/${id}`, payload);
  return res.data;
};
