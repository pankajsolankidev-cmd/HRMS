export const PERMISSIONS = {
  COMPONENT_CREATE: "component.create",
  COMPONENT_VIEW: "component.view",
  COMPONENT_UPDATE: "component.update",
  COMPONENT_DELETE: "component.delete",

  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_VIEW: "employee.view",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  LEAVE_CREATE: "leave.create",
  LEAVE_VIEW_ALL: "leave.view_all",
  LEAVE_UPDATE_ALL: "leave.update_all",
  LEAVE_DELETE_ALL: "leave.delete_all",
  LEAVE_APPROVE: "leave.approve",

  PAYROLL_PROCESS: "payroll.process",
  PAYROLL_VIEW: "payroll.view",
  PAYROLL_UPDATE: "payroll.update",
  PAYROLL_DELETE: "payroll.delete",
  PAYROLL_VIEW_SUMMARY: "payroll.view_summary",

  SALARY_CREATE: "salary.create",
  SALARY_VIEW: "salary.view",
  SALARY_UPDATE: "salary.update",
  SALARY_DELETE: "salary.delete",

  SYSTEM_CREATE: "system.create",
  SYSTEM_VIEW: "system.view",
  SYSTEM_UPDATE: "system.update",
  SYSTEM_DELETE: "system.delete",

  EXPENSE_CREATE: "expense.create",
  EXPENSE_VIEW_ALL: "expense.view_all",
  EXPENSE_UPDATE_ALL: "expense.update_all",
  EXPENSE_DELETE_ALL: "expense.delete_all",
  EXPENSE_SUBMIT: "expense.submit",
  EXPENSE_APPROVE: "expense.approve",
  EXPENSE_VIEW_SUMMARY: "expense.view_summary",

  PROJECT_CREATE: "project.create",
  PROJECT_VIEW: "project.view",
  PROJECT_UPDATE: "project.update",
  PROJECT_DELETE: "project.delete",
  PROJECT_ASSIGN: "project.assign",

  DEPARTMENT_CREATE: "department.create",
  DEPARTMENT_VIEW: "department.view",
  DEPARTMENT_UPDATE: "department.update",
  DEPARTMENT_DELETE: "department.delete",

  HOLIDAY_CREATE: "holiday.create",
  HOLIDAY_VIEW: "holiday.view",
  HOLIDAY_UPDATE: "holiday.update",
  HOLIDAY_DELETE: "holiday.delete",
  HOLIDAY_EXPORT: "holiday.export",

  ORGANIZATION_VIEW: "organization.view",
  ORGANIZATION_UPDATE: "organization.update",

  DASHBOARD_VIEW_ADMIN: "dashboard.view_admin",
  DASHBOARD_VIEW_EMPLOYEE: "dashboard.view_employee",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
