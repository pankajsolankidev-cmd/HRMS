import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface AccessTokenPayload {
  id: string;
  email: string;
  roles: string[]; 
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("invalid token");
  }
  return secret;
}

export function generateAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash);
}
