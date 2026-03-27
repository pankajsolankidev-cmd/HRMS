import * as Sentry from "@sentry/node";
import { FastifyInstance } from "fastify";

export async function sentryPlugin(fastify: FastifyInstance) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  });

  fastify.addHook("onRequest", async (request) => {
    if (request.user) {
      Sentry.setUser({
        id: request.user.id,
        email: request.user.email,
      });
    }
  });

  fastify.setErrorHandler((error, request, reply) => {
    Sentry.captureException(error);

    request.log.error(
      {
        err: error,
        url: request.url,
        method: request.method,
      },
      "Unhandled error occurred",
    );

    reply.status(500).send({
      message: "Internal Server Error",
    });
  });
}
