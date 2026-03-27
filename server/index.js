import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

const UPLOADS_DIR = join(__dirname, 'uploads')
const DATA_FILE = join(__dirname, 'bestanden.json')

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, '[]')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

function loadMeta() {
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function saveMeta(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

app.get('/api/bestanden', (req, res) => {
  res.json(loadMeta())
})

app.post('/api/bestanden', upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Geen bestand meegegeven' })

  const id = `d_${Date.now()}`
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${id}_${safeName}`

  writeFileSync(join(UPLOADS_DIR, filename), file.buffer)

  const bestand = {
    id,
    naam: req.body.naam?.trim() || file.originalname,
    beschrijving: req.body.beschrijving || '',
    categorie: req.body.categorie || '',
    bestandsnaam: file.originalname,
    bestandstype: file.mimetype,
    grootte: file.size,
    geuploadOp: new Date().toISOString(),
    geuploadDoor: req.body.geuploadDoor || 'Onbekend',
    url: `/uploads/${filename}`,
  }

  const meta = loadMeta()
  meta.push(bestand)
  saveMeta(meta)

  res.json(bestand)
})

app.delete('/api/bestanden/:id', (req, res) => {
  const meta = loadMeta()
  const idx = meta.findIndex(b => b.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Niet gevonden' })

  const bestand = meta[idx]
  const bestandsnaam = bestand.url.replace('/uploads/', '')
  const filepath = join(UPLOADS_DIR, bestandsnaam)
  if (existsSync(filepath)) unlinkSync(filepath)

  meta.splice(idx, 1)
  saveMeta(meta)

  res.json({ ok: true })
})

// --- Email ---

const emailGeconfigureerd = !!process.env.EMAIL_HOST

const transporterConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
}
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporterConfig.auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
}

const transporter = emailGeconfigureerd ? nodemailer.createTransport(transporterConfig) : null

if (!emailGeconfigureerd) {
  console.warn('⚠️  Email niet geconfigureerd. Stel EMAIL_HOST in via .env')
}

function emailTemplate(titel, inhoud) {
  return `
  <!DOCTYPE html>
  <html lang="nl">
  <head><meta charset="UTF-8"><style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 8px; max-width: 480px; margin: 0 auto; overflow: hidden; }
    .header { background: #1e4010; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 18px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #aed198; }
    .body { padding: 28px 24px; color: #333; font-size: 14px; line-height: 1.6; }
    .body h2 { color: #1e4010; margin-top: 0; }
    .pin { font-size: 32px; font-weight: bold; letter-spacing: 12px; text-align: center;
           background: #eef5e8; border-radius: 8px; padding: 16px; color: #1e4010; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding: 16px 24px; font-size: 12px; color: #999; text-align: center; }
  </style></head>
  <body>
    <div class="card">
      <div class="header">
        <h1>A-Compagnie · 30e Infanteriebataljon</h1>
        <p>13 Lichte Brigade — Reservisten Onboarding</p>
      </div>
      <div class="body">
        <h2>${titel}</h2>
        ${inhoud}
      </div>
      <div class="footer">Dit is een automatisch bericht. Reageer niet op deze e-mail.</div>
    </div>
  </body>
  </html>`
}

const TEMPLATES = {
  registratie: ({ naam }) => ({
    onderwerp: 'Account aangevraagd — wacht op activatie',
    html: emailTemplate('Account aangevraagd', `
      <p>Beste ${naam},</p>
      <p>Je account voor het Reservisten Onboarding Portaal is aangemaakt en wacht op activatie door een commandant of beheerder.</p>
      <p>Je ontvangt een bevestigingsmail zodra je account is goedgekeurd.</p>
    `),
  }),
  registratie_admin: ({ naam, email, pelotoon }) => ({
    onderwerp: `Nieuw account aangevraagd — ${naam}`,
    html: emailTemplate('Nieuw account ter activatie', `
      <p>Er heeft een nieuwe gebruiker een account aangevraagd:</p>
      <ul>
        <li><strong>Naam:</strong> ${naam}</li>
        <li><strong>E-mail:</strong> ${email}</li>
        <li><strong>Peloton:</strong> ${pelotoon}</li>
      </ul>
      <p>Log in op het portaal om het account te activeren of af te wijzen.</p>
    `),
  }),
  activatie: ({ naam }) => ({
    onderwerp: 'Je account is geactiveerd',
    html: emailTemplate('Account geactiveerd', `
      <p>Beste ${naam},</p>
      <p>Goed nieuws — je account voor het Reservisten Onboarding Portaal is geactiveerd. Je kunt nu inloggen.</p>
    `),
  }),
  'pin-reset': ({ naam, pin }) => ({
    onderwerp: 'Je pincode',
    html: emailTemplate('Pincode herinnering', `
      <p>Beste ${naam},</p>
      <p>Je hebt een pincode-herinnering aangevraagd. Je huidige pincode is:</p>
      <div class="pin">${pin}</div>
      <p>Bewaar deze code op een veilige plek. Je kunt je pincode wijzigen via je profiel.</p>
    `),
  }),
}

app.post('/api/email', async (req, res) => {
  const { type, naar: naarRaw, naam, email, pelotoon, pin } = req.body

  if (!type) return res.status(400).json({ error: 'type is verplicht' })
  if (!TEMPLATES[type]) return res.status(400).json({ error: `Onbekend type: ${type}` })

  // Admin-notificaties altijd naar het geconfigureerde admin-adres sturen
  const naar = type === 'registratie_admin'
    ? (process.env.EMAIL_ADMIN || process.env.EMAIL_USER)
    : naarRaw

  if (!naar) return res.status(400).json({ error: 'naar is verplicht' })

  if (!emailGeconfigureerd) {
    console.log(`[Email gesimuleerd] type=${type} naar=${naar}`)
    return res.json({ ok: true, gesimuleerd: true })
  }

  try {
    const { onderwerp, html } = TEMPLATES[type]({ naam, email, pelotoon, pin })
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: naar,
      subject: onderwerp,
      html,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Email versturen mislukt:', err.message)
    res.status(500).json({ error: 'Email versturen mislukt' })
  }
})

app.listen(PORT, () => {
  console.log(`API server draait op http://localhost:${PORT}`)
})
