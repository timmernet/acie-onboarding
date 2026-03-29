import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import { prisma } from './prisma.js'

import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import takenRouter from './routes/taken.js'
import contactenRouter from './routes/contacten.js'
import bestandenRouter from './routes/bestanden.js'
import configRouter from './routes/config.js'
import pelotonenRouter from './routes/pelotonen.js'
import groepenRouter from './routes/groepen.js'
import auditRouter from './routes/audit.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// Zorg dat uploads-map bestaat
const UPLOADS_DIR = join(__dirname, 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting — algemeen
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel verzoeken, probeer het later opnieuw' },
}))

// Rate limiting — strikt voor auth
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel inlogpogingen, probeer het over 15 minuten opnieuw' },
}))

app.use('/api/auth/pin-reset', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel reset-verzoeken, probeer het over een uur opnieuw' },
}))

// CORS — in productie zet APP_URL op de publieke domeinnaam
const allowedOrigins = [
  process.env.APP_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
]
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
// Thema-assets (logo, favicon) worden inline weergegeven
// Overige uploads krijgen Content-Disposition: attachment (voorkomt inline-uitvoering)
app.use('/uploads', (req, res, next) => {
  if (!req.path.startsWith('/thema_')) {
    res.setHeader('Content-Disposition', `attachment; filename="${req.path.split('/').pop()}"`)
  }
  next()
}, express.static(UPLOADS_DIR))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/taken', takenRouter)
app.use('/api/contacten', contactenRouter)
app.use('/api/bestanden', bestandenRouter)
app.use('/api/config', configRouter)
app.use('/api/pelotonen', pelotonenRouter)
app.use('/api/groepen', groepenRouter)
app.use('/api/audit', auditRouter)

// In productie: serveer de Vite build
if (process.env.NODE_ENV === 'production') {
  const distDir = join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
}

const server = app.listen(PORT, () => {
  console.log(`API server draait op http://localhost:${PORT}`)
  if (!process.env.JWT_SECRET) {
    console.warn('[WAARSCHUWING] JWT_SECRET niet ingesteld — gebruik een veilige waarde in productie!')
  }
})

async function gracefulShutdown(signaal) {
  console.log(`[${signaal}] Graceful shutdown gestart…`)
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Database verbinding gesloten. Server gestopt.')
    process.exit(0)
  })
  // Forceer stop na 10s als lopende verzoeken niet eindigen
  setTimeout(() => { console.error('Geforceerde stop na timeout.'); process.exit(1) }, 10_000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT',  () => gracefulShutdown('SIGINT'))
