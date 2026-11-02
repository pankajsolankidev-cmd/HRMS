export type CreateDepartmentDto = {
  name: string;
};

export type UpdateDepartmentDto = {
  name?: string;
};

export interface DepartmentEntity {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
