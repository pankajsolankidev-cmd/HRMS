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


