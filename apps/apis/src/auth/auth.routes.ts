import { eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { users } from "./auth.model";
import { db } from "../db";
import type {
  AuthSignUpDto,
  AuthSignInDto,
} from "@shared/types/src/auth/auth.dto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signup", async (request, reply) => {
    const { username, email, password } = request.body as AuthSignUpDto;
    if (!username || !email || !password) {
      return reply.status(400).send({ error: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const [user] = await db
        .insert(users)
        .values({ username, email, password: hashedPassword })
        .returning();
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );
      return { token };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.post("/signin", async (request, reply) => {
    const { email, password } = request.body as AuthSignInDto;
    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: "Email and password are required" });
    }
    // Import eq from drizzle-orm for filtering
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    return { token };
  });
}
