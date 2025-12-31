import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

export interface AuthUser {
  id: string
  email: string
  iat?: number
  exp?: number
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest<AuthUser | null>('user', null)
})
