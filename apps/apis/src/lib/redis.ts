import Redis from "ioredis";

let connectionOptions: any;

if (process.env.REDIS_URL) {
  connectionOptions = process.env.REDIS_URL;
  if (connectionOptions.startsWith("rediss://")) {
    // ioredis handles rediss:// connection strings, but we might need to specify tls options if it fails
    // However, usually rediss:// is enough. For Upstash, it works out of the box.
  }
} else {
  connectionOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  };
  if (process.env.REDIS_TLS === "true") {
    connectionOptions.tls = { rejectUnauthorized: false };
  }
}

const redis = new Redis(connectionOptions);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;
