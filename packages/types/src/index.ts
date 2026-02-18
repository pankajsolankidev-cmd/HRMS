export * from "./organization/create-organization.dto";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
}
