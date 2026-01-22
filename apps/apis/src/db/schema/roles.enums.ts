export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  HR: "HR",
  ADMIN: "ADMIN",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];


