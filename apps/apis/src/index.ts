import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";

import authRoutes from "../src/auth/auth.routes";
import employeeRoutes from "./modules/employees/employee.routes";
import systemRoutes from "./modules/systems/system.routes";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: ["http://localhost:5173", "http://192.168.1.33:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

app.register(cookie);

app.register(swagger, {
  openapi: {
    info: {
      title: "HRM API",
      version: "1.0.0",
      description: "API documentation for HRM system",
    },
  },
});

app.register(swaggerUI, {
  routePrefix: "/docs",
});

app.register(authRoutes, { prefix: "/auth" });
app.register(employeeRoutes);
app.register(systemRoutes);

app.get("/health", async () => {
  return { status: "API is running 🚀" };
});

app.listen(
  {
    port: Number(process.env.PORT) || 4000,
    host: "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`API running on ${address}`);
  }
);
