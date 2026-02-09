import { PayrollMonthType } from "../../../../apps/apis/src/db/schema/payroll.enums";

export type ProcessPayrollDto = {
  employeeId: string;
  month: PayrollMonthType;
  year: number;
  deductions?: string;
  deductionReason?: string;
  bonus?: string;
  bonusDescription?: string;
  file?: string;
};

export interface UpdatePayrollDto {
  employeeId: string;
  month: PayrollMonthType;
  year: number;
  deductions?: string;
  deductionReason?: string;
  bonus?: string;
  bonusDescription?: string;
  file?: string;
}
