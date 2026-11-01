export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  positionId: string;
  departmentId?: string;
  managerId?: string | null;
  systemId?: string | null;
  joiningDate?: string;

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
