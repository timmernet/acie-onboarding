import { Router } from 'express'
import multer from 'multer'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { verstuurTestEmail } from '../email.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'
import { valideerAfbeelding } from '../fileValidation.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

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
  const { emailPass, emailClientSecret, ...publiek } = config
  res.json(publiek)
})

// PUT /api/config/thema — beheerder only
router.put('/thema', requireAuth, requireRol('beheerder'), validate({
  primairKleur: { hex: true },
  appNaam:      { maxLength: 100 },
  eenheidNaam:  { maxLength: 150 },
  eenheidSubtitel: { maxLength: 200 },
  browserTitel: { maxLength: 100 },
  naamReservist:       { maxLength: 50 },
  naamGroepscommandant:{ maxLength: 50 },
  naamCommandant:      { maxLength: 50 },
  naamPeloton:         { maxLength: 50 },
  naamGroep:           { maxLength: 50 },
}), async (req, res) => {
  const { appNaam, eenheidNaam, eenheidSubtitel, logoUrl, primairKleur,
    naamReservist, naamGroepscommandant, naamCommandant, naamPeloton, naamGroep,
    browserTitel, faviconUrl } = req.body
  const data = { appNaam, eenheidNaam, eenheidSubtitel, logoUrl, primairKleur,
    naamReservist, naamGroepscommandant, naamCommandant, naamPeloton, naamGroep,
    browserTitel: browserTitel ?? '', faviconUrl: faviconUrl ?? '' }
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })
  logAuditEvent({ ...actor(req), actie: 'CONFIG_THEMA', entiteit: 'AppConfig', entiteitId: '1', details: { appNaam, primairKleur } })
  const { emailPass, ...rest } = config
  res.json(rest)
})

// PUT /api/config/email — beheerder only
router.put('/email', requireAuth, requireRol('beheerder'), validate({
  emailType: { enum: ['smtp', 'exchange'] },
  emailPort: { port: true },
  emailUser: { maxLength: 255 },
  emailFrom: { maxLength: 255 },
  emailAdmin:{ maxLength: 255 },
}), async (req, res) => {
  const { emailType, emailHost, emailPort, emailSecure, emailUser, emailPass,
    emailFrom, emailAdmin, emailTenantId, emailClientId, emailClientSecret } = req.body
  const data = {
    emailType: emailType ?? 'smtp',
    emailHost: emailHost ?? '',
    emailPort: Number(emailPort) || 587,
    emailSecure: Boolean(emailSecure),
    emailUser: emailUser ?? '',
    emailFrom: emailFrom ?? '',
    emailAdmin: emailAdmin ?? '',
    emailTenantId: emailTenantId ?? '',
    emailClientId: emailClientId ?? '',
  }
  // Gevoelige velden alleen updaten als ze zijn meegegeven
  if (emailPass !== undefined && emailPass !== '') data.emailPass = emailPass
  if (emailClientSecret !== undefined && emailClientSecret !== '') data.emailClientSecret = emailClientSecret
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })
  logAuditEvent({ ...actor(req), actie: 'CONFIG_EMAIL', entiteit: 'AppConfig', entiteitId: '1', details: { emailType: data.emailType, emailHost: data.emailHost } })
  const { emailPass: _p, emailClientSecret: _s, ...rest } = config
  res.json(rest)
})

// POST /api/config/email/test — beheerder only
router.post('/email/test', requireAuth, requireRol('beheerder'), async (req, res) => {
  const config = await getOrCreateConfig()
  const emailType = config.emailType || 'smtp'
  const isExchange = emailType === 'exchange'

  if (!isExchange && !config.emailHost && !process.env.EMAIL_HOST) {
    return res.status(400).json({ error: 'Geen e-mailserver geconfigureerd' })
  }
  if (isExchange && (!config.emailTenantId || !config.emailClientId || !config.emailClientSecret)) {
    return res.status(400).json({ error: 'Exchange Online: Tenant ID, Client ID en Client Secret zijn vereist' })
  }

  const cfg = {
    emailType,
    host: config.emailHost || process.env.EMAIL_HOST || '',
    port: config.emailPort || Number(process.env.EMAIL_PORT) || 587,
    secure: config.emailHost ? config.emailSecure : process.env.EMAIL_SECURE === 'true',
    user: config.emailUser || process.env.EMAIL_USER || '',
    pass: config.emailPass || process.env.EMAIL_PASS || '',
    from: config.emailFrom || process.env.EMAIL_FROM || config.emailUser || '',
    tenantId: config.emailTenantId || '',
    clientId: config.emailClientId || '',
    clientSecret: config.emailClientSecret || '',
  }

  const beheerder = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true } })
  if (!beheerder?.email) return res.status(400).json({ error: 'Eigen e-mailadres niet gevonden' })

  try {
    await verstuurTestEmail(cfg, beheerder.email)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/config/upload — thema-afbeelding uploaden (geen Bestand-record)
router.post('/upload', requireAuth, requireRol('beheerder'), upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Geen bestand meegegeven' })
  try {
    valideerAfbeelding(file.buffer, 2 * 1024 * 1024)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `thema_${Date.now()}_${safeName}`
  writeFileSync(join(UPLOADS_DIR, filename), file.buffer)
  res.json({ url: `/uploads/${filename}` })
})

export default router
