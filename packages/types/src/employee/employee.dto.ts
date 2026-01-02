export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  position: string;

  departmentId?: number;
  joiningDate: string;

  managerId?: string | null;

  systemId?: string;

  welcome: {
    whatsapp: boolean;
    gmail: boolean;
    slack: boolean;
  };

  documents: {
    generateOfferLetter: boolean;
    generateAppointmentLetter: boolean;
  };
}
