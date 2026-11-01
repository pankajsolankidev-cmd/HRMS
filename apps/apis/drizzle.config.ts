import dotenv from 'dotenv'
dotenv.config({ path: 'apps/apis/.env' })

import type { Config } from 'drizzle-kit'

// ✅ Runtime validation (IMPORTANT)
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL
} = process.env

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error('Database environment variables are not defined')
}

export default {
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: DB_HOST,              
    port: Number(DB_PORT ?? 4000),
    user: DB_USER,              
    password: DB_PASSWORD,      
    database: DB_NAME,          
    ssl: DB_SSL === 'true'
  }
} satisfies Config
