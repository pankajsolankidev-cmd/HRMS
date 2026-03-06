export * from "./components/create-component.dto";
export * from "./components/update-component.dto";
export * from "./employee/employee.dto";
export * from "./employee/update-employee.dto";
export * from "./expense/create-expense.dto";
export * from "./expense/update-expense.dto";
export * from "./organization/create-organization.dto";
export * from "./payroll/salary.dto";
export * from "./project/project.dto";
export * from "./system/system.dto";
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
}
