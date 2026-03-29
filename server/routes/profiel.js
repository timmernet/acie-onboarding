import { Router } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'
import { valideerAfbeelding } from '../fileValidation.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

/** Verifieer de PIN van de ingelogde gebruiker. Geeft false terug bij mismatch. */
async function verifieerPin(userId, pin) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false
  return bcrypt.compare(String(pin), user.pin)
}

// GET /api/profiel
router.get('/', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { peloton: true, groep: true },
  })
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' })
  const { pin, loginPogingen, geblokkerdTot, ...rest } = user
  res.json({
    ...rest,
    pelotoonNaam: user.peloton?.naam ?? '',
    groepNaam: user.groep?.naam ?? null,
  })
})

// PUT /api/profiel/gegevens — naam en/of email wijzigen
router.put('/gegevens', requireAuth, validate({
  naam:  { required: true, maxLength: 100 },
  email: { required: true, email: true, maxLength: 255 },
  pin:   { required: true },
}), async (req, res) => {
  const { naam, email, pin } = req.body

  if (!await verifieerPin(req.user.userId, pin)) {
    return res.status(403).json({ error: 'Pincode is onjuist' })
  }

  const conflict = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), NOT: { id: req.user.userId } },
  })
  if (conflict) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik' })

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: { naam: naam.trim(), email: email.toLowerCase() },
    include: { peloton: true, groep: true },
  })
  logAuditEvent({ ...actor(req), actie: 'PROFIEL_BIJGEWERKT', entiteit: 'User', entiteitId: user.id, details: { naam: user.naam, email: user.email } })
  const { pin: _p, loginPogingen: _l, geblokkerdTot: _g, ...rest } = user
  res.json({ ...rest, pelotoonNaam: user.peloton?.naam ?? '', groepNaam: user.groep?.naam ?? null })
})

// PUT /api/profiel/pin — pincode wijzigen
router.put('/pin', requireAuth, validate({
  huidigPin: { required: true },
  nieuwPin:  { required: true, pin: true },
}), async (req, res) => {
  const { huidigPin, nieuwPin } = req.body

  if (!await verifieerPin(req.user.userId, huidigPin)) {
    return res.status(403).json({ error: 'Huidige pincode is onjuist' })
  }

  const hashedPin = await bcrypt.hash(String(nieuwPin), 10)
  await prisma.user.update({ where: { id: req.user.userId }, data: { pin: hashedPin } })
  logAuditEvent({ ...actor(req), actie: 'PIN_GEWIJZIGD', entiteit: 'User', entiteitId: req.user.userId })
  res.json({ ok: true })
})

// POST /api/profiel/foto — profielfoto uploaden
router.post('/foto', requireAuth, upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Geen bestand meegegeven' })

  try {
    valideerAfbeelding(file.buffer, 5 * 1024 * 1024)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `profiel_${req.user.userId}_${Date.now()}_${safeName}`
  writeFileSync(join(UPLOADS_DIR, filename), file.buffer)

  const url = `/uploads/${filename}`
  await prisma.user.update({ where: { id: req.user.userId }, data: { profielFoto: url } })
  res.json({ url })
})

// DELETE /api/profiel — eigen account verwijderen
router.delete('/', requireAuth, validate({
  pin: { required: true },
}), async (req, res) => {
  const { pin } = req.body

  if (!await verifieerPin(req.user.userId, pin)) {
    return res.status(403).json({ error: 'Pincode is onjuist' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  logAuditEvent({ ...actor(req), actie: 'PROFIEL_VERWIJDERD', entiteit: 'User', entiteitId: req.user.userId, details: { naam: user?.naam, email: user?.email } })
  await prisma.user.delete({ where: { id: req.user.userId } })
  res.json({ ok: true })
})

export default router
