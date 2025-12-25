import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import authRoutes from "./auth/auth.routes";

const app = Fastify();

app.register(cors);

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

app.register(authRoutes);

app.get("/health", async (_request, _reply) => {
  return { status: "API is running 🚀" };
});

app.listen({ port: 4000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API running on ${address}`);
});
