import type { ComponentEntity } from "../components/create-component.dto";

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

export interface SystemEntity {
  id: string;
  name: string;
  description?: string;
  components?: ComponentEntity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PositionEntity {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
