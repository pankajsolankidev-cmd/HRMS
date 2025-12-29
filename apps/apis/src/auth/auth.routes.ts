import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fastifyCookie from '@fastify/cookie'

import { users } from '../db/schema/users.schema'
import { refreshTokens } from '../db/schema/refresh-tokens.schema'
import { db } from '../db'

import type {
  AuthSignUpDto,
  AuthSignInDto
} from '@shared/types/src/auth/auth.dto'

const JWT_SECRET = process.env.JWT_SECRET!


function generateAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex')
}

async function hashToken(token: string) {
  return bcrypt.hash(token, 10)
}

async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash)
}

export default async function authRoutes(app: FastifyInstance) {

 
  app.post('/signup', async (request, reply) => {
    const { username, email, password } = request.body as AuthSignUpDto

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'All fields are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const [user] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email
        })

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email
      })

      return reply.status(201).send({ accessToken })

    } catch (err: any) {
      if (err?.code === '23505') {
        return reply.status(409).send({
          error: 'User with this email or username already exists'
        })
      }

      console.error('Signup error:', err)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  app.post('/signin', async (request, reply) => {
    const { email, password } = request.body as AuthSignInDto

    if (!email || !password) {
      return reply.status(400).send({
        error: 'Email and password are required'
      })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

  
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email
    })

    const refreshToken = generateRefreshToken()
    const refreshTokenHash = await hashToken(refreshToken)

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    })

   
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      path: '/auth/refresh'
    })

    return reply.status(200).send({ accessToken })
  })

 
  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken

    if (!refreshToken) {
      return reply.status(401).send({ error: 'Refresh token missing' })
    }

    const tokens = await db.select().from(refreshTokens)

    for (const record of tokens) {
      const isValid = await compareToken(refreshToken, record.tokenHash)

      if (isValid) {
        if (record.expiresAt < new Date()) {
          return reply.status(401).send({ error: 'Refresh token expired' })
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, record.userId))

        const newAccessToken = generateAccessToken({
          id: user.id,
          email: user.email
        })

        return reply.send({ accessToken: newAccessToken })
      }
    }

    return reply.status(401).send({ error: 'Invalid refresh token' })
  })

  app.post('/auth/logout', async (request, reply) => {
  const refreshToken = request.cookies.refreshToken

  if (refreshToken) {
    await db.delete(refreshTokens)
  }

  reply.clearCookie('refreshToken', {
    path: '/auth/refresh'
  })

  return reply.send({ message: 'Logged out' })
})

}
