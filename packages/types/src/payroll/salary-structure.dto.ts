export type CreateSalaryStructureDto = {
  employeeId: string;
  basicSalary: number;
  description?: string;
  appraisalDate?: string;
};

export type UpdateSalaryStructureDto = {
  basicSalary?: number;
  description?: string;
  appraisalDate?: string;
};
