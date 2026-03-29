import { Router } from 'express'
import nodemailer from 'nodemailer'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'

const router = Router()

async function getOrCreateConfig() {
  return prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })
}

// GET /api/config — publiek (login-pagina branding + thema)
router.get('/', async (req, res) => {
  const config = await getOrCreateConfig()
  const { emailPass, ...publiek } = config
  res.json(publiek)
})

// PUT /api/config/thema — beheerder only
router.put('/thema', requireAuth, requireRol('beheerder'), async (req, res) => {
  const { appNaam, eenheidNaam, eenheidSubtitel, logoUrl, primairKleur } = req.body
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1, appNaam, eenheidNaam, eenheidSubtitel, logoUrl, primairKleur },
    update: { appNaam, eenheidNaam, eenheidSubtitel, logoUrl, primairKleur },
  })
  const { emailPass, ...rest } = config
  res.json(rest)
})

// PUT /api/config/email — beheerder only
router.put('/email', requireAuth, requireRol('beheerder'), async (req, res) => {
  const { emailHost, emailPort, emailSecure, emailUser, emailPass, emailFrom, emailAdmin } = req.body
  const data = {
    emailHost: emailHost ?? '',
    emailPort: Number(emailPort) || 587,
    emailSecure: Boolean(emailSecure),
    emailUser: emailUser ?? '',
    emailFrom: emailFrom ?? '',
    emailAdmin: emailAdmin ?? '',
  }
  // Alleen updaten als een wachtwoord is meegegeven (lege string = niet wijzigen)
  if (emailPass !== undefined && emailPass !== '') {
    data.emailPass = emailPass
  }
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })
  const { emailPass: _, ...rest } = config
  res.json(rest)
})

// POST /api/config/email/test — beheerder only
router.post('/email/test', requireAuth, requireRol('beheerder'), async (req, res) => {
  const config = await getOrCreateConfig()
  const host = config.emailHost || process.env.EMAIL_HOST
  if (!host) {
    return res.status(400).json({ error: 'Geen e-mailserver geconfigureerd' })
  }
  const port = config.emailPort || Number(process.env.EMAIL_PORT) || 587
  const secure = config.emailHost ? config.emailSecure : process.env.EMAIL_SECURE === 'true'
  const user = config.emailUser || process.env.EMAIL_USER
  const pass = config.emailPass || process.env.EMAIL_PASS
  const from = config.emailFrom || process.env.EMAIL_FROM || user

  const transportConfig = { host, port, secure, tls: { rejectUnauthorized: false } }
  if (user && pass) transportConfig.auth = { user, pass }

  try {
    const transporter = nodemailer.createTransport(transportConfig)
    await transporter.sendMail({
      from,
      to: req.user.email,
      subject: 'Test e-mail — Onboarding Portaal',
      text: 'De e-mailconfiguratie werkt correct.',
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
