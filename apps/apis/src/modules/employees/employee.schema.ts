export const createEmployeeSchema = {
  tags: ['Employees'],
  body: {
    type: 'object',
    required: [
      'firstName',
      'lastName',
      'email',
      'position',
      'joiningDate',
      'systemId',
      'userId',
      'welcome',
      'documents'
    ],
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string', format: 'email' },
      position: { type: 'string' },

      departmentId: { type: 'number' },
      joiningDate: { type: 'string', format: 'date' },

      managerId: { type: ['string', 'null'] },

      systemId: { type: 'string' },
      userId: { type: 'string' },

      welcome: {
        type: 'object',
        required: ['whatsapp', 'gmail', 'slack'],
        properties: {
          whatsapp: { type: 'boolean' },
          gmail: { type: 'boolean' },
          slack: { type: 'boolean' }
        }
      },

      documents: {
        type: 'object',
        required: [
          'generateOfferLetter',
          'generateAppointmentLetter'
        ],
        properties: {
          generateOfferLetter: { type: 'boolean' },
          generateAppointmentLetter: { type: 'boolean' }
        }
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        employeeId: { type: 'string' }
      }
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const updateEmployeeSchema = {
  tags: ['Employees'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      position: { type: 'string' },
      departmentId: { type: 'number' },
      managerId: { type: ['string', 'null'] },
      systemId: { type: 'string' },

      welcomewithWhatsapp: { type: 'boolean' },
      welcomewithGmail: { type: 'boolean' },
      welcomewithSlack: { type: 'boolean' }
    }
  }
};

export const getEmployeeByIdSchema = {
  tags: ['Employees'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};
