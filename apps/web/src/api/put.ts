import api from "./axios";
export const updateEmployee = async ({id,payload,}: {
  id: string;
  payload: any;
}) => {
  const res = await api.put(`/employees/${id}`, payload);
  return res.data;
};
export const updateSystem = async ({id,payload,}: {
  id: string;
  payload: {
    name: string;
    description: string;
    components: string[];
  };
}) => {
  return api.put(`/systems/${id}`, {
    name: payload.name,
    description: payload.description,
    componentIds: payload.components,
  });
};

