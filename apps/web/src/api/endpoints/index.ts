/**
 * Standard entity identifier accepted in resource URLs.
 */
export type ResourceId = string;

/**
 * Common resource base paths.
 * Single source of truth for all domain root endpoints.
 */
export const RESOURCE_PATHS = {
  AUTH: "/auth",
  EMPLOYEES: "/employees",
  COMPONENTS: "/components",
  SYSTEMS: "/systems",
  POSITIONS: "/positions",
  DEPARTMENTS: "/departments",
  ORGANIZATION: "/organization",
  PROJECTS: "/projects",
  LEAVES: "/leave-requests",
  EXPENSES: "/expenses",
  PAYROLLS: "/payrolls",
  SALARY: "/salary",
  HOLIDAYS: "/holidays",
  NOTIFICATIONS: "/notifications",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  FILES: "/files",
} as const;

/**
 * Reusable endpoint factory for standard CRUD resources.
 * Eliminates repetitive boilerplate for BASE and BY_ID endpoint builders.
 */
const createCrudEndpoints = <T extends string>(base: T) => ({
  BASE: base,
  BY_ID: (id: ResourceId) => `${base}/${id}` as const,
});

/**
 * Centralized API endpoints registry.
 * Composed using resource base paths and endpoint factories to prevent URL duplication.
 */
export const API_ENDPOINTS = {
  AUTH: {
    BASE: RESOURCE_PATHS.AUTH,
    SIGN_IN: "/signin",
    LOGOUT: `${RESOURCE_PATHS.AUTH}/logout`,
    REFRESH: `${RESOURCE_PATHS.AUTH}/refresh`,
    SESSION: `${RESOURCE_PATHS.AUTH}/session`,
    FORGOT_PASSWORD: `${RESOURCE_PATHS.AUTH}/forgot-password`,
    RESET_PASSWORD: `${RESOURCE_PATHS.AUTH}/reset-password`,
  },

  EMPLOYEES: createCrudEndpoints(RESOURCE_PATHS.EMPLOYEES),

  COMPONENTS: createCrudEndpoints(RESOURCE_PATHS.COMPONENTS),

  SYSTEMS: createCrudEndpoints(RESOURCE_PATHS.SYSTEMS),

  POSITIONS: {
    BASE: RESOURCE_PATHS.POSITIONS,
  },

  DEPARTMENTS: createCrudEndpoints(RESOURCE_PATHS.DEPARTMENTS),

  ORGANIZATION: {
    BASE: RESOURCE_PATHS.ORGANIZATION,
  },

  PROJECTS: {
    ...createCrudEndpoints(RESOURCE_PATHS.PROJECTS),
    EMPLOYEES: (projectId: ResourceId) =>
      `${RESOURCE_PATHS.PROJECTS}/${projectId}/employees`,
    EMPLOYEE_DETAIL: (projectId: ResourceId, employeeId: ResourceId) =>
      `${RESOURCE_PATHS.PROJECTS}/${projectId}/employees/${employeeId}`,
  },

  LEAVES: {
    ...createCrudEndpoints(RESOURCE_PATHS.LEAVES),
    MANUAL: `${RESOURCE_PATHS.LEAVES}/manual`,
    MANUAL_BY_ID: (id: ResourceId) => `${RESOURCE_PATHS.LEAVES}/manual/${id}`,
    APPROVE: (id: ResourceId) => `${RESOURCE_PATHS.LEAVES}/${id}/approve`,
    REJECT: (id: ResourceId) => `${RESOURCE_PATHS.LEAVES}/${id}/reject`,
    DOWNLOAD: (id: ResourceId) => `${RESOURCE_PATHS.LEAVES}/${id}/download`,
  },

  EXPENSES: {
    ...createCrudEndpoints(RESOURCE_PATHS.EXPENSES),
    CREATE: `${RESOURCE_PATHS.EXPENSES}/create`,
    SUMMARY: `${RESOURCE_PATHS.EXPENSES}/summary`,
    APPROVE: (id: ResourceId) => `${RESOURCE_PATHS.EXPENSES}/${id}/approve`,
    REJECT: (id: ResourceId) => `${RESOURCE_PATHS.EXPENSES}/${id}/reject`,
    SUBMIT: (id: ResourceId) => `${RESOURCE_PATHS.EXPENSES}/${id}/create`,
    DOWNLOAD: (id: ResourceId) => `${RESOURCE_PATHS.EXPENSES}/${id}/download`,
  },

  PAYROLL: {
    ...createCrudEndpoints(RESOURCE_PATHS.PAYROLLS),
    BULK_PREVIEW: `${RESOURCE_PATHS.PAYROLLS}/bulk/employee`,
    SUMMARY: `${RESOURCE_PATHS.PAYROLLS}/summary`,
    BULK_PROCESS: `${RESOURCE_PATHS.PAYROLLS}/bulk/process`,
  },

  SALARY: createCrudEndpoints(RESOURCE_PATHS.SALARY),

  HOLIDAYS: {
    ...createCrudEndpoints(RESOURCE_PATHS.HOLIDAYS),
    EXPORT_PDF: `${RESOURCE_PATHS.HOLIDAYS}/export/pdf`,
    UPLOAD_TEMPLATE: `${RESOURCE_PATHS.HOLIDAYS}/upload/template`,
    CHECK_IMPORT: `${RESOURCE_PATHS.HOLIDAYS}/upload/check`,
    CONFIRM_IMPORT: `${RESOURCE_PATHS.HOLIDAYS}/upload/confirm`,
  },

  NOTIFICATIONS: {
    BASE: RESOURCE_PATHS.NOTIFICATIONS,
    UNREAD_COUNT: `${RESOURCE_PATHS.NOTIFICATIONS}/unread-count`,
    MARK_READ: (id: ResourceId) => `${RESOURCE_PATHS.NOTIFICATIONS}/${id}/read`,
    MARK_ALL_READ: `${RESOURCE_PATHS.NOTIFICATIONS}/read-all`,
  },

  DASHBOARD: {
    BASE: RESOURCE_PATHS.DASHBOARD,
    ADMIN_SUMMARY: `${RESOURCE_PATHS.DASHBOARD}/summary`,
    EMPLOYEE_SUMMARY: "/employee/dashboard/summary",
  },

  PROFILE: {
    BASE: RESOURCE_PATHS.PROFILE,
  },

  FILES: {
    BASE: RESOURCE_PATHS.FILES,
    UPLOAD: `${RESOURCE_PATHS.FILES}/upload`,
  },
} as const;
