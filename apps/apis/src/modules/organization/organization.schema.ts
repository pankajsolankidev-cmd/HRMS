const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const upsertOrganizationSchema = {
  tags: ["Organization"],

  body: {
    type: "object",
    required: ["name", "workingHours", "weekOff"],

    properties: {
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 3,
      },

      workingHours: {
        type: "object",
        required: ["start", "end"],

        properties: {
          start: {
            type: "string",
            transform: ["trim"], // HH:mm
          },

          end: {
            type: "string",
            transform: ["trim"], // HH:mm
          },
        },

        additionalProperties: false,
      },

      weekOff: {
        type: "array",
        minItems: 1,

        items: {
          type: "string",
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
        },
      },
    },

    additionalProperties: false,
  },

  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },

    201: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },

    400: errorResponse,
  },
};

export const getOrganizationSchema = {
  tags: ["Organization"],

  response: {
    200: {
      type: "object",

      properties: {
        id: { type: "string", format: "uuid" },

        name: { type: "string" },

        workingStartTime: { type: "string" },
        workingEndTime: { type: "string" },

        weekOff: {
          type: "array",

          items: {
            type: "string",
            enum: [
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
              "SUNDAY",
            ],
          },
        },

        createdAt: {
          type: "string",
          format: "date-time",
        },

        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },

      required: [
        "id",
        "name",
        "workingStartTime",
        "workingEndTime",
        "weekOff",
        "createdAt",
        "updatedAt",
      ],
    },

    404: errorResponse,
  },
};
