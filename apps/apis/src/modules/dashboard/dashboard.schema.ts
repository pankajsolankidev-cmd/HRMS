export const getDashboardSummarySchema = {
  tags: ["Dashboard"],
  summary: "Get dashboard summary data",
  description:
    "Returns employee statistics, leave information, and recent activities for dashboard",

  response: {
    200: {
      type: "object",
      properties: {
        totalEmployees: { type: "number" },

        availableToday: { type: "number" },

        onLeaveToday: {
          type: "object",
          properties: {
            count: { type: "number" },

            employees: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  type: { type: "string" }, 
                  fromDate: { type: "string", format: "date" },
                  toDate: { type: "string", format: "date" },
                  totalDays: { type: "string" }, 
                },
                required: [
                  "id",
                  "firstName",
                  "lastName",
                  "type",
                  "fromDate",
                  "toDate",
                  "totalDays",
                ],
              },
            },
          },
          required: ["count", "employees"],
        },

        recentLeaves: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              employeeName: { type: "string" },
              type: { type: "string" },
              status: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
            required: [
              "id",
              "employeeName",
              "type",
              "status",
              "createdAt",
            ],
          },
        },

        recentExpenses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              employeeName: { type: "string" },
              expenseType: { type: "string" },
              amount: { type: "number" }, 
              status: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
            required: [
              "id",
              "employeeName",
              "expenseType",
              "amount",
              "status",
              "createdAt",
            ],
          },
        },
      },

      required: [
        "totalEmployees",
        "availableToday",
        "onLeaveToday",
        "recentLeaves",
        "recentExpenses",
      ],
    },

    403: {
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