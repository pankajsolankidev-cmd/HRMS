const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

export const signUpSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["username", "email", "password"],
    properties: {
      username: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
      },
    },
    400: errorResponse,
    409: errorResponse,
    500: errorResponse,
  },
};

export const signInSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        email: { type: "string", format: "email" },

        accessToken: { type: "string" },
        refreshToken: { type: "string" },

        roles: {
          type: "array",
          items: { type: "string" },
        },
        permissions: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    400: errorResponse,
    401: errorResponse,
    500: errorResponse,
  },
};

export const refreshTokenSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        email: { type: "string", format: "email" },

        accessToken: { type: "string" },

        roles: {
          type: "array",
          items: { type: "string" },
        },
        permissions: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    401: errorResponse,
    500: errorResponse,
  },
};

export const logoutSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
    500: errorResponse,
  },
};

export const forgotPasswordSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        key: { type: "string" },
      },
    },
    500: errorResponse,
  },
};

export const resetPasswordSchema = {
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["key", "newPassword"],
    properties: {
      key: { type: "string" },
      newPassword: { type: "string", minLength: 6 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
    400: errorResponse,
    500: errorResponse,
  },
};
