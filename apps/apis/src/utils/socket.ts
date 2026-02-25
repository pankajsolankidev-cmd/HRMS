import { Server, Socket } from "socket.io";
import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";

let io: Server;

export function registerSocket(app: FastifyInstance) {
  io = new Server(app.server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        roles: string[];
      };

      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    console.log("✅ Connected:", user.id);

    // Personal room
    socket.join(`user_${user.id}`);

    // Admin room
    if (
      user.roles.includes("ADMIN") ||
      user.roles.includes("HR")
    ) {
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
