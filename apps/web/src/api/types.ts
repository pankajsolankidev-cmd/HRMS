export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ListQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  excludeAssigned?: boolean;
  excludeAdmin?: boolean;
};

export type ApiMessageResponse = {
  message: string;
};

export type AddLeavePayload = {
  fromDate: string;
  toDate: string;
  type: "sick" | "casual" | "marriage" | "wfh";
  dayType: "full_day" | "first_half" | "second_half" | "multiple_days";
  reason: string;
  file?: string;
  fromHour: number;
  toHour: number;
};

export type UpdateLeavePayload = {
  fromDate: string;
  toDate: string;
  type: "sick" | "casual" | "marriage" | "wfh";
  dayType: "full_day" | "first_half" | "second_half" | "multiple_days";
  reason: string;
  fromHour: number;
  toHour: number;
  file?: string;
};

export type UpdateEmployeeLeavePayload = UpdateLeavePayload & {
  employeeId: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
  roles: string[];
  permissions: string[];
  id: string;
  email: string;
  message?: string;
};

export type ResetPasswordPayload = {
  key: string;
  newPassword: string;
};
