export type CreateSalaryDto = {
  employeeId: string;
  basicSalary: number;
  tax?: number;
  pf?: number;
  description?: string;
  appraisalDate?: string;
};

export type UpdateSalaryDto = {
  basicSalary?: number;
  tax?: number;
  pf?: number;
  description?: string;
  appraisalDate?: string;
};

export interface SalaryStructureEntity {
  id: string;
  employeeId: string;
  basicSalary: number;
  tax: number;
  pf?: number;
  description?: string;
  appraisalDate?: string;
  netSalary?: number;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
