import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { prisma } from '../prisma.js'
import { verstuurEmail } from '../email.js'
import { JWT_SECRET, COOKIE_NAME, COOKIE_MAX_AGE, requireAuth } from '../middleware/auth.js'

const router = Router()

function formatUser(user) {
  const { pin, userTaken, taken, ...rest } = user
  const takenArr = (userTaken ?? taken ?? [])
  return {
    ...rest,
    taken: takenArr.map(t => ({
      taskId: t.taakId,
      voltooid: t.voltooid,
      voltooiDatum: t.voltooiDatum ?? undefined,
      opmerking: t.opmerking ?? undefined,
      nieuw: t.nieuw,
    })),
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, pin } = req.body
  if (!email || !pin) return res.status(400).json({ error: 'email en pin zijn verplicht' })

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { taken: true },
  })

  if (!user) return res.json({ result: 'fout' })

  const pinKlopt = await bcrypt.compare(String(pin), user.pin)
  if (!pinKlopt) return res.json({ result: 'fout' })

  if (!user.actief) return res.json({ result: 'wacht' })

  const now = new Date().toISOString()
  await prisma.user.update({ where: { id: user.id }, data: { laatstIngelogd: now } })

  const token = jwt.sign({ userId: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '8h' })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })

  res.json({ result: 'ok', user: formatUser({ ...user, taken: user.taken, laatstIngelogd: now }) })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { taken: true },
  })
  if (!user || !user.actief) {
    res.clearCookie(COOKIE_NAME)
    return res.status(401).json({ error: 'Gebruiker niet gevonden of inactief' })
  }
  res.json(formatUser(user))
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { naam, email, pin, pelotoon } = req.body
  if (!naam || !email || !pin || !pelotoon) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' })
  }
  if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'Pin moet precies 4 cijfers zijn' })
  }

  const bestaand = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (bestaand) return res.status(409).json({ error: 'Dit e-mailadres is al geregistreerd.' })

  const hashedPin = await bcrypt.hash(String(pin), 10)
  const alleTaken = await prisma.taak.findMany()

  const user = await prisma.user.create({
    data: {
      naam,
      email: email.toLowerCase(),
      pin: hashedPin,
      rol: 'reservist',
      pelotoon,
      aangemeldOp: new Date().toISOString().split('T')[0],
      actief: false,
      taken: {
        create: alleTaken.map(t => ({ taakId: t.id })),
      },
    },
    include: { taken: true },
  })

  const adminEmail = process.env.EMAIL_ADMIN || process.env.EMAIL_USER
  verstuurEmail('registratie', user.email, { naam })
  if (adminEmail) verstuurEmail('registratie_admin', adminEmail, { naam, email: user.email, pelotoon })

  res.json({ ok: true })
})

// POST /api/auth/pin-reset/aanvragen
router.post('/pin-reset/aanvragen', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is verplicht' })

  // Altijd succes tonen (security by obscurity)
  res.json({ ok: true })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.actief) return

  const token = randomBytes(32).toString('hex')
  const expires = BigInt(Date.now() + 60 * 60 * 1000) // 1 uur

  // Verwijder eventuele bestaande tokens voor dit email
  await prisma.pinResetToken.deleteMany({ where: { email: email.toLowerCase() } })
  await prisma.pinResetToken.create({
    data: { token, email: email.toLowerCase(), naam: user.naam, expires },
  })

  const appUrl = process.env.APP_URL || 'http://localhost:5173'
  const resetUrl = `${appUrl}/pin-reset?token=${token}`
  verstuurEmail('pin-reset', user.email, { naam: user.naam, resetUrl })
})

// POST /api/auth/pin-reset/toepassen
router.post('/pin-reset/toepassen', async (req, res) => {
  const { token, pin } = req.body
  if (!token || !pin) return res.status(400).json({ error: 'token en pin zijn verplicht' })
  if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'Pin moet precies 4 cijfers zijn' })
  }

  const record = await prisma.pinResetToken.findUnique({ where: { token } })
  if (!record || record.used) return res.status(404).json({ error: 'Ongeldige of al gebruikte resetlink.' })
  if (BigInt(Date.now()) > record.expires) {
    await prisma.pinResetToken.delete({ where: { token } })
    return res.status(410).json({ error: 'Link is verlopen' })
  }

  const hashedPin = await bcrypt.hash(String(pin), 10)
  await prisma.user.update({
    where: { email: record.email },
    data: { pin: hashedPin },
  })
  await prisma.pinResetToken.delete({ where: { token } })

  res.json({ ok: true })
})

export default router
