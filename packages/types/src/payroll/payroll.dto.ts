import { PayrollMonthType } from "../../../../apps/apis/src/db/schema/payroll.enums";

export type ProcessPayrollDto = {
  employeeId: string;
  month: PayrollMonthType;
  year: number;
  totalDeductions?: number;
  file?: string;
};

export interface UpdatePayrollDto {
  employeeId?: string;
  month?: PayrollMonthType;
  year?: number;
  totalDeductions?: string;
  netSalary?: string;
  file?: string;
}
