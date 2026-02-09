import { PayrollMonthType } from "../../../../apps/apis/src/db/schema/payroll.enums";

export type ProcessPayrollDto = {
  employeeId: string;
  month: PayrollMonthType;
  year: number;
  deductions?: string;
  bonus?: string;
  file?: string;
};


export interface UpdatePayrollDto {
  employeeId?: string;
  month?: PayrollMonthType;
  year?: number;
  deductions?: string;
  bonus?: string;
  netSalary?: string;
  file?: string;
}
