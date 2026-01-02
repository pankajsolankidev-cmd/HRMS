export interface CreateSystemDto {
  name: string;
  description?: string;
  componentIds?: string[];
}
export interface UpdateSystemDto {
  name?: string;
  description?: string;
  componentIds?: string[];
}
