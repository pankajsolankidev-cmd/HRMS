export const getProfileSchema = {
  tags: ["Profile"],
  response: {
    200: {
      type: "object",
      properties: {
        organization: {
          type: ["object", "null"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            workingStartTime: { type: "string" },
            workingEndTime: { type: "string" },
            weekOff: {
              type: "array",
              items: { type: "string" },
            },
          },
        },

        profile: {
          type: "object",
          properties: {
            employee: {
              type: "object",
              properties: {
                id: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                email: { type: "string" },
                joiningDate: { type: ["string", "null"] },
                userId: { type: ["string", "null"] },

                welcome: {
                  type: "object",
                  properties: {
                    welcomewithWhatsapp: { type: "boolean" },
                    welcomewithGmail: { type: "boolean" },
                    welcomewithSlack: { type: "boolean" },
                  },
                },

                documents: {
                  type: ["object", "null"],
                  properties: {
                    generateOfferLetter: { type: "boolean" },
                    generateAppointmentLetter: { type: "boolean" },
                  },
                },

                position: {
                  type: ["object", "null"],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },

                department: {
                  type: ["object", "null"],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },

                manager: {
                  type: ["object", "null"],
                  properties: {
                    id: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    email: { type: "string" },
                  },
                },

                system: {
                  type: ["object", "null"],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    components: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          description: { type: ["string", "null"] },
                          code: { type: ["string", "null"] },
                        },
                      },
                    },
                  },
                },
              },
              required: ["id", "firstName", "lastName", "email"],
            },
          },
          required: ["employee"],
        },
      },
      required: ["organization", "profile"],
    },

    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },

    500: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};
