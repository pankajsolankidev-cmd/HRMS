import type { CreateProjectDto, UpdateProjectDto } from "@shared/types";
import { axiosClient } from "../client/axiosClient";
import { API_ENDPOINTS, type ResourceId } from "../endpoints";
import type { ListQueryParams, PaginatedResponse } from "../types";

export const projectService = {
  getAll: async (params?: ListQueryParams) => {
    const res = await axiosClient.get<PaginatedResponse<any>>(
      API_ENDPOINTS.PROJECTS.BASE,
      { params },
    );
    return res.data;
  },

  getById: async (id: ResourceId) => {
    const res = await axiosClient.get(API_ENDPOINTS.PROJECTS.BY_ID(id));
    return res.data;
  },

  getEmployees: async (projectId: ResourceId) => {
    const res = await axiosClient.get(
      API_ENDPOINTS.PROJECTS.EMPLOYEES(projectId),
    );
    return res.data;
  },

  create: async (payload: CreateProjectDto) => {
    const res = await axiosClient.post(API_ENDPOINTS.PROJECTS.BASE, payload);
    return res.data;
  },

  update: async (id: ResourceId, payload: UpdateProjectDto) => {
    const res = await axiosClient.put(API_ENDPOINTS.PROJECTS.BY_ID(id), payload);
    return res.data;
  },

  delete: async (id: ResourceId) => {
    const res = await axiosClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(id));
    return res.data;
  },

  assignEmployees: async (projectId: ResourceId, employeeIds: string[]) => {
    const res = await axiosClient.post(
      API_ENDPOINTS.PROJECTS.EMPLOYEES(projectId),
      { employeeIds },
    );
    return res.data;
  },

  removeEmployee: async (
    projectId: ResourceId,
    employeeId: ResourceId,
  ) => {
    const res = await axiosClient.delete(
      API_ENDPOINTS.PROJECTS.EMPLOYEE_DETAIL(projectId, employeeId),
    );
    return res.data;
  },
};

// Aliases for compatibility
export const getProjects = projectService.getAll;
export const getProjectById = projectService.getById;
export const getProjectEmployees = projectService.getEmployees;
export const addProject = projectService.create;
export const updateProject = (params: { id: ResourceId; payload: UpdateProjectDto }) =>
  projectService.update(params.id, params.payload);
export const deleteProject = (id: ResourceId) => projectService.delete(id);
export const assignEmployeeToProject = (params: {
  projectId: ResourceId;
  employeeIds: string[];
}) => projectService.assignEmployees(params.projectId, params.employeeIds);
export const removeEmployeeFromProject = (params: {
  projectId: ResourceId;
  employeeId: ResourceId;
}) => projectService.removeEmployee(params.projectId, params.employeeId);
