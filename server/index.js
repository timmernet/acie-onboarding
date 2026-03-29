import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import takenRouter from './routes/taken.js'
import contactenRouter from './routes/contacten.js'
import bestandenRouter from './routes/bestanden.js'
import configRouter from './routes/config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// Zorg dat uploads-map bestaat
const UPLOADS_DIR = join(__dirname, 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

// CORS — in productie zet APP_URL op de publieke domeinnaam
const allowedOrigins = [
  process.env.APP_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
]
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(UPLOADS_DIR))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/taken', takenRouter)
app.use('/api/contacten', contactenRouter)
app.use('/api/bestanden', bestandenRouter)
app.use('/api/config', configRouter)

// In productie: serveer de Vite build
if (process.env.NODE_ENV === 'production') {
  const distDir = join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`API server draait op http://localhost:${PORT}`)
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET niet ingesteld — gebruik een veilige waarde in productie!')
  }
})
