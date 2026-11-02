export interface CreateComponentDto {
  name: string;
  description?: string;
  code: string;
}

export interface ComponentEntity {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}
