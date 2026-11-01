import type {
  CreateComponentDto,
  CreateSystemDto,
  UpdateComponentDto,
  UpdateSystemDto,
} from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const systemService = {
  // Systems
  getSystems: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.SYSTEMS.BASE,
      { params },
    );
    return res.data;
  },

  getSystemById: async (id: ResourceId) => {
    const res = await axiosClient.get(API_ENDPOINTS.SYSTEMS.BY_ID(id));
    return res.data;
  },

  createSystem: async (payload: CreateSystemDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.SYSTEMS.BASE, payload);
    return res.data;
  },

  updateSystem: async (id: ResourceId, payload: UpdateSystemDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.SYSTEMS.BY_ID(id), payload);
    return res.data;
  },

  deleteSystem: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.SYSTEMS.BY_ID(id));
    return res.data;
  },

  // Components
  getComponents: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.COMPONENTS.BASE,
      { params },
    );
    return res.data;
  },

  getComponentById: async (id: ResourceId) => {
    const res = await axiosClient.get(API_ENDPOINTS.COMPONENTS.BY_ID(id));
    return res.data;
  },

  createComponent: async (payload: CreateComponentDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.COMPONENTS.BASE, payload);
    return res.data;
  },

  updateComponent: async (id: ResourceId, payload: UpdateComponentDto) => {
    const res = await axiosClient.put(
      API_ENDPOINTS.COMPONENTS.BY_ID(id),
      payload,
    );
    return res.data;
  },

  deleteComponent: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.COMPONENTS.BY_ID(id));
    return res.data;
  },

  // Positions
  getPositions: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.POSITIONS.BASE,
      { params },
    );
    return res.data;
  },
};

// Aliases for compatibility
export const getSystems = systemService.getSystems;
export const getSystemById = systemService.getSystemById;
export const addSystem = systemService.createSystem;
export const updateSystem = ({
  id,
  payload,
}: {
  id: ResourceId;
  payload: UpdateSystemDto;
}) => systemService.updateSystem(id, payload);
export const deleteSystem = (id: ResourceId) =>
  systemService.deleteSystem(id);

export const getComponents = systemService.getComponents;
export const getComponentById = systemService.getComponentById;
export const addComponent = systemService.createComponent;
export const updateComponent = ({
  id,
  payload,
}: {
  id: ResourceId;
  payload: UpdateComponentDto;
}) => systemService.updateComponent(id, payload);
export const deleteComponent = (id: ResourceId) =>
  systemService.deleteComponent(id);

export const getPositions = systemService.getPositions;
