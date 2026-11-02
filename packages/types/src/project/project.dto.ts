export interface CreateProjectDto {
  name: string;
  clientName?: string;
  startDate: string;
  expectedEndDate?: string;
}

export interface UpdateProjectDto {
  name?: string;
  clientName?: string;
  startDate?: string;
  expectedEndDate?: string;
  status?: "ACTIVE" | "COMPLETED";
}

export interface ProjectEntity {
  id: string;
  name: string;
  clientName?: string;
  startDate: string;
  expectedEndDate?: string;
  status: "ACTIVE" | "COMPLETED";
  createdAt?: string;
  updatedAt?: string;
}
