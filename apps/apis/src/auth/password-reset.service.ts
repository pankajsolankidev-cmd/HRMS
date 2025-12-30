import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export function generateResetKey() {
  return crypto.randomBytes(32).toString('hex')
}

export async function hashResetToken(token: string) {
  return bcrypt.hash(token, 10)
}

export async function compareResetToken(
  token: string,
  hash: string
) {
  return bcrypt.compare(token, hash)
}
