export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  position?: string;
  departmentId?: number;
  managerId?: string | null;
  systemId?: string | null;

  welcome?: {
    welcomewithWhatsapp?: boolean;
    welcomewithGmail?: boolean;
    welcomewithSlack?: boolean;
  };

  documents?: {
    generateOfferLetter?: boolean;
    generateAppointmentLetter?: boolean;
  };
}
