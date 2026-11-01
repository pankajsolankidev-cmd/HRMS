import { Server, Socket } from "socket.io";
import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import redis from "../lib/redis";

let io: Server;

export function registerSocket(app: FastifyInstance) {
  io = new Server(app.server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      const session = await redis.get(`auth:${decoded.id}`);

      if (!session) {
        return next(new Error("Session expired"));
      }

      const data = JSON.parse(session);

      socket.data.user = {
        id: decoded.id,
        roles: data.roles ?? [],
        permissions: data.permissions ?? [],
      };

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    console.log("✅ Connected:", user.id);

    socket.join(`user_${user.id}`);

    if (user.roles.includes("ADMIN") || user.roles.includes("HR")) {
      socket.join("admin_room");
    }

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", user.id);
    });
  });
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
}
