export const getNotificationsSchema = {
  tags: ["Notifications"],
  querystring: {
    type: "object",
    properties: {
      page: { type: "number", minimum: 1, default: 1 },
      limit: { type: "number", minimum: 1, maximum: 100, default: 10 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              userId: { type: "string" },
              message: { type: "string" },
              isRead: { type: "boolean" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
            required: [
              "id",
              "userId",
              "message",
              "isRead",
              "createdAt",
              "updatedAt",
            ],
          },
        },
        meta: {
          type: "object",
          properties: {
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" },
          },
          required: ["total", "page", "limit"],
        },
      },
      required: ["data", "meta"],
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

export const getUnreadNotificationCountSchema = {
  tags: ["Notifications"],
  response: {
    200: {
      type: "object",
      properties: {
        count: { type: "number" },
      },
      required: ["count"],
    },
  },
};

export const markNotificationAsReadSchema = {
  tags: ["Notifications"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
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
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};

export const markAllNotificationsAsReadSchema = {
  tags: ["Notifications"],
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};
