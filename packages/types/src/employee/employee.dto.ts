export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  position: string;

  departmentId?: number;
  joiningDate: string;
  managerId?: string | null;
  systemId?: string | null;

  welcome: {
    welcomewithWhatsapp: boolean;
    welcomewithGmail: boolean;
    welcomewithSlack: boolean;
  };

  documents: {
    generateOfferLetter: boolean;
    generateAppointmentLetter: boolean;
  };
}
