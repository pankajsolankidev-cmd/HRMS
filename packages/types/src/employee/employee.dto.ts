export interface CreateEmployeeDto {
  firstName: string
  lastName: string
  email: string
  position: string
  departmentId?: number
  joiningDate: string
  managerId?: number
  buddyId?: number

  welcome: {
    whatsapp: boolean
    gmail: boolean
    slack: boolean
  }

  systems: string[]

  documents: {
    generateOfferLetter: boolean
    generateAppointmentLetter: boolean
  }
}
