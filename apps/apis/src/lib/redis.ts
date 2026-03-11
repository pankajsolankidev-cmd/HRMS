import fp from "fastify-plugin";
import Redis from "ioredis";
import { FastifyPluginAsync } from "fastify";

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  redis.on("connect", () => {
    fastify.log.info("Redis connected");
  });

  redis.on("error", (err) => {
    fastify.log.error("Redis error: " + err);
  });

  fastify.decorate("redis", redis);
};

export default fp(redisPlugin);

