export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  positionId: string;

  departmentId?: string | null;
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

export interface EmployeeEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joiningDate: string;
  userId?: string;
  position?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  system?: { id: string; name: string } | null;
  documents?: {
    generateOfferLetter: boolean;
    generateAppointmentLetter: boolean;
  };
  welcome?: {
    welcomewithGmail: boolean;
    welcomewithWhatsapp: boolean;
    welcomewithSlack: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}
