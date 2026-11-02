import { PayrollMonthType } from "./payroll.enums";

export type ProcessPayrollDto = {
  employeeId: string;
  month: PayrollMonthType;
  year: number;
  deductions?: number;
  deductionReason?: string;
  bonus?: number;
  bonusDescription?: string;
  file?: string;
};

export interface UpdatePayrollDto {
  employeeId?: string;
  month?: PayrollMonthType;
  year?: number;
  deductions?: number;
  deductionReason?: string;
  bonus?: number;
  bonusDescription?: string;
  file?: string;
}

export interface PayrollEntity {
  id: string;
  employeeId: string;
  month: PayrollMonthType | string;
  year: number;
  basicSalary: number;
  deductions?: number;
  bonus?: number;
  netSalary: number;
  status?: string;
  processedAt?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
