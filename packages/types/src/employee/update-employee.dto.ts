export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  position?: string;

  departmentId?: number;
  managerId?: string | null;
  systemId?: string;

  welcomewithWhatsapp?: boolean;
  welcomewithGmail?: boolean;
  welcomewithSlack?: boolean;
}
