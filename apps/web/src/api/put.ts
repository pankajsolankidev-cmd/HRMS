import api from "./axios";

export const updateEmployee = async ({
  id,
  payload,
}: {
  id: string;
  payload: any;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};

export const updateComponent = async ({
  id,
  payload,
}: {
  id: string;
  payload: any;
}) => {
  const res = await api.put(`/components/${id}`, payload);
  return res.data;
};

export const updateSystem = async ({
  id,
  payload,
}: {
  id: string;
  payload: {
    name: string;
    description: string;
    components: string[];
  };
}) => {
  const res = await api.put(`/systems/${id}`, {
    name: payload.name,
    description: payload.description,
    componentIds: payload.components,
  });
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



