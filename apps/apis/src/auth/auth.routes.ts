import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { users } from './auth.model'
import { db } from '../db'

import type {
  AuthSignUpDto,
  AuthSignInDto
} from '@shared/types/src/auth/auth.dto'

const JWT_SECRET = process.env.JWT_SECRET!

export default async function authRoutes(app: FastifyInstance) {


  app.post('/signup', async (request, reply) => {
    const { username, email, password } = request.body as AuthSignUpDto

    if (!username || !email || !password) {
      return reply.status(400).send({
        error: 'All fields are required'
      })
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

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      )

      return reply.status(201).send({ token })

    } catch (err: any) {
      
      if (err?.code === '23505') {
        return reply.status(409).send({
          error: 'User with this email or username already exists'
        })
      }

      console.error('Signup error:', err)
      return reply.status(500).send({
        error: 'Internal server error'
      })
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
      return reply.status(401).send({
        error: 'Invalid credentials'
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Invalid credentials'
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    return reply.status(200).send({ token })
  })
}
