export type ProcessPayrollDto = {
  employeeId: string;
  month: number;
  year: number;
  totalDeductions?: number;
  file?: string;
};

export interface UpdatePayrollDto {
  employeeId?: string;
  month?: number;
  year?: number;
  totalDeductions?: string;
  netSalary?: string;
  file?: string;
}

