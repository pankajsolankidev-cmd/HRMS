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

  const client = new Redis(connectionOptions, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    connectTimeout: 10000,
    lazyConnect: true,
  });

  client.on("connect", () => {
    console.log("Connected to Redis successfully 🚀");
  });

  client.on("error", (err: any) => {
    console.error("Redis error:", err);
  });


  client.connect();

  (global as any).redisInstance = client;
}

redis = (global as any).redisInstance;

export default redis;