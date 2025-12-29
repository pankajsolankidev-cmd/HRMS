import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex')
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10)
}

export async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash)
}
