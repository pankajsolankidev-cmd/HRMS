import dotenv from 'dotenv'

// ✅ MUST BE FIRST
dotenv.config({ path: '.env' })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

import authRoutes from './auth/auth.routes'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: [
    'http://localhost:5174',
    'http://192.168.1.33:5174' 
  ],
  credentials: true
})

app.register(swagger, {
  openapi: {
    info: {
      title: 'HRM API',
      version: '1.0.0',
      description: 'API documentation for HRM system'
    }
  }
})

app.register(swaggerUI, {
  routePrefix: '/docs'
})

app.register(authRoutes)

app.get('/health', async () => {
  return { status: 'API is running 🚀' }
})


app.listen(
  {
    port: Number(process.env.PORT) || 4000,
    host: '0.0.0.0'
  },
  (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`API running on ${address}`)
  }
)
