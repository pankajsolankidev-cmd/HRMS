import api from "./axios";

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