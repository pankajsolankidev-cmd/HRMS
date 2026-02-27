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
            required: ["id", "employeeName", "type", "status", "createdAt"],
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

export const getEmployeeDashboardSchema = {
  tags: ["Employee Dashboard"],
  summary: "Get employee dashboard summary",
  description:
    "Returns leave balance, upcoming holiday and current active project for logged-in employee",

  response: {
    200: {
      type: "object",
      properties: {
        leaveBalance: {
          type: "object",
          properties: {
            monthsWorked: { type: "number" },
            monthlyAccrual: { type: "number" },
            totalEarned: { type: "number" },
            totalUsed: { type: "number" },
            remaining: { type: "number" },
          },
          required: [
            "monthsWorked",
            "monthlyAccrual",
            "totalEarned",
            "totalUsed",
            "remaining",
          ],
        },

        upcomingHoliday: {
          anyOf: [
            {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                fromDate: { type: "string", format: "date" },
                toDate: { type: "string", format: "date" },
                description: { type: ["string", "null"] },
              },
              required: ["id", "title", "fromDate", "toDate"],
            },
            { type: "null" },
          ],
        },

        currentProject: {
          anyOf: [
            {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                clientName: { type: ["string", "null"] },
                startDate: { type: "string", format: "date" },
                expectedEndDate: {
                  anyOf: [{ type: "string", format: "date" }, { type: "null" }],
                },
                status: { type: "string" },
              },
              required: ["id", "name", "startDate", "status"],
            },
            { type: "null" },
          ],
        },
      },

      required: ["leaveBalance", "upcomingHoliday", "currentProject"],
    },

    401: {
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

    500: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};
