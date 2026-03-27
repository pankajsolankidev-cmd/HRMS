import Redis from "ioredis";

let redis: Redis;

let connectionOptions: any;

if (process.env.REDIS_URL) {
  connectionOptions = process.env.REDIS_URL;
} else {
  connectionOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  };
  if (process.env.REDIS_TLS === "true") {
    connectionOptions.tls = { rejectUnauthorized: false };
  }
}

if (!(global as any).redisInstance) {
  console.log("Initializing shared Redis client...");
  (global as any).redisInstance = new Redis(connectionOptions);
  
  (global as any).redisInstance.on("connect", () => {
    console.log("Connected to Redis successfully 🚀");
  });

  (global as any).redisInstance.on("error", (err: any) => {
    console.error("Redis error:", err);
  });
}

redis = (global as any).redisInstance;

export default redis;
