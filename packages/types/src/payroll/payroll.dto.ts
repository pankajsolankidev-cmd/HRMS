export type ProcessPayrollDto = {
  employeeId: string;
  month: number;
  year: number;
  totalDeductions?: number;
  file?: string;
};
