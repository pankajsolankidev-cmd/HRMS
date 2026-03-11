import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import Fastify, { FastifyInstance } from "fastify";
import { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifySensible from "@fastify/sensible";

import authRoutes from "../src/auth/auth.routes";
import employeeRoutes from "./modules/employees/employee.routes";
import systemRoutes from "./modules/systems/system.routes";
import componentRoutes from "./modules/components/component.routes";
import leaveRequestRoutes from "./modules/leave-requests/leave-request.routes";
import fileRoutes from "./modules/files/file.routes";
import salaryRoutes from "./modules/payroll/salary.routes";
import { payrollRoutes } from "./modules/payroll/payroll.routes";
import positionRoutes from "./modules/master/position.routes";
import expenseRoutes from "./modules/Expense/expense.routes";
import departmentRoutes from "./modules/Department/department.routes";
import organizationRoutes from "./modules/organization/organization.routes";
import projectRoutes from "./modules/project/project.routes";
import projectEmployeeRoutes from "./modules/project-emp/project-employee.routes";
import profileRoutes from "./modules/profile/profile.route";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import { registerSocket } from "./utils/socket";
import notificationRoutes from "./modules/notifications/notifications.routes";
import holidayRoutes from "./modules/holiday/holiday.routes";
import ajvKeywords from "ajv-keywords";
import Ajv from "ajv";
import redisPlugin from "./lib/redis";

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      coerceTypes: true,
      removeAdditional: "all",
      useDefaults: true,
    },
    plugins: [
      (ajv: Ajv) => {
        ajvKeywords(ajv, ["transform"]);
      },
    ],
  },
});

app.register(fastifySensible);

app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.register(cors, {
  origin: ["http://localhost:5173", "http://192.168.1.35:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

app.register(cookie);

app.register(swagger, {
  openapi: {
    info: {
      title: "HRM API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

app.register(swaggerUI, {
  routePrefix: "/docs",
});

app.register(redisPlugin);
app.register(authRoutes);

app.register(employeeRoutes, {
  schema: {
    security: [{ bearerAuth: [] }],
  },
});
app.register(systemRoutes);
app.register(componentRoutes);
app.register(leaveRequestRoutes);
app.register(fileRoutes);
app.register(salaryRoutes);
app.register(payrollRoutes);
app.register(positionRoutes);
app.register(expenseRoutes);
app.register(departmentRoutes);
app.register(organizationRoutes);
app.register(projectRoutes);
app.register(projectEmployeeRoutes);
app.register(profileRoutes);
app.register(dashboardRoutes);
app.register(notificationRoutes);
app.register(holidayRoutes);

app.get("/health", async () => {
  return { status: "API is running 🚀" };
});

app.get("/redis-test", async (request, reply) => {
  await app.redis.set("hrms:test", "working");

  const value = await app.redis.get("hrms:test");

  return {
    message: "Redis test success",
    value,
  };
});

async function start() {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 4000,
      host: "0.0.0.0",
    });

    registerSocket(app);

    app.log.info("Server started successfully 🚀");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
