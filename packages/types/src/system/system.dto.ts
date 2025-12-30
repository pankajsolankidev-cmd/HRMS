export interface CreateSystemDto {
  name: string
  description?: string
}

export interface UpdateSystemDto {
  name?: string
  description?: string
}