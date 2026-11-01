import { PayrollMonthType } from "./payroll.enums";

export interface PayrollFilterDto {
  month?: PayrollMonthType;
  year?: number;
  employeeId?: string;

  page?: number;
  limit?: number;
  sortBy?: "processedAt" | "netSalary" | "year";
  sortOrder?: "asc" | "desc";
}
