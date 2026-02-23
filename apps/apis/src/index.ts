import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifySensible from "@fastify/sensible";

import authRoutes from "../src/auth/auth.routes";
import employeeRoutes from "./modules/employees/employee.routes";
import systemRoutes from "./modules/systems/system.routes";
import authPlugin from "./plugins/auth.plugin";
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

const app = Fastify({ logger: true });

app.register(fastifySensible);

app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.register(cors, {
  origin: ["http://localhost:5173", "http://192.168.1.34:5173"],
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

app.register(authPlugin);
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

app.get("/health", async () => {
  return { status: "API is running 🚀" };
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
