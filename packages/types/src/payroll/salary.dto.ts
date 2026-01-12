export type CreateSalaryDto = {
  employeeId: string;
  basicSalary: number;
  description?: string;
  appraisalDate?: string;
};

export type UpdateSalaryDto = {
  basicSalary?: number;
  description?: string;
  appraisalDate?: string;
};
