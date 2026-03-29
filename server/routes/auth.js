import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { prisma } from '../prisma.js'
import { verstuurEmail } from '../email.js'
import { JWT_SECRET, COOKIE_NAME, COOKIE_MAX_AGE, requireAuth } from '../middleware/auth.js'
import { logAuditEvent, getIp } from '../audit.js'
import { validate } from '../validate.js'

const router = Router()

const MAX_LOGIN_POGINGEN = 5
const BLOKKEER_DUUR_MS = 15 * 60 * 1000 // 15 minuten

function formatUser(user) {
  const { pin, userTaken, taken, peloton, groep, loginPogingen, geblokkerdTot, ...rest } = user
  const takenArr = (userTaken ?? taken ?? [])
  return {
    ...rest,
    pelotoonNaam: peloton?.naam ?? '',
    groepNaam: groep?.naam ?? null,
    taken: takenArr.map(t => ({
      taskId: t.taakId,
      voltooid: t.voltooid,
      voltooiDatum: t.voltooiDatum ?? undefined,
      opmerking: t.opmerking ?? undefined,
      nieuw: t.nieuw,
    })),
  }
}

const USER_INCLUDE = { taken: true, peloton: true, groep: true }

// POST /api/auth/login
router.post('/login', validate({
  email: { required: true, email: true, maxLength: 255 },
  pin:   { required: true },
}), async (req, res) => {
  const { email, pin } = req.body

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: USER_INCLUDE,
  })

  // Gebruiker niet gevonden — geen info lekken, maar ook geen lockout-counter ophogen
  if (!user) {
    logAuditEvent({ actie: 'LOGIN_FOUT', details: { email: email.toLowerCase() }, ipAdres: getIp(req) })
    return res.json({ result: 'fout' })
  }

  // Controleer accountvergrendeling
  if (user.geblokkerdTot && new Date(user.geblokkerdTot) > new Date()) {
    return res.json({ result: 'geblokkeerd', geblokkerdTot: user.geblokkerdTot })
  }

  const pinKlopt = await bcrypt.compare(String(pin), user.pin)

  if (!pinKlopt) {
    const nieuwePogingenCount = user.loginPogingen + 1
    if (nieuwePogingenCount >= MAX_LOGIN_POGINGEN) {
      const geblokkerdTot = new Date(Date.now() + BLOKKEER_DUUR_MS).toISOString()
      await prisma.user.update({ where: { id: user.id }, data: { loginPogingen: nieuwePogingenCount, geblokkerdTot } })
      logAuditEvent({ userId: user.id, userNaam: user.naam, userRol: user.rol, actie: 'ACCOUNT_GEBLOKKEERD', entiteit: 'User', entiteitId: user.id, details: { geblokkerdTot }, ipAdres: getIp(req) })
      return res.json({ result: 'geblokkeerd', geblokkerdTot })
    }
    await prisma.user.update({ where: { id: user.id }, data: { loginPogingen: nieuwePogingenCount } })
    logAuditEvent({ userId: user.id, userNaam: user.naam, userRol: user.rol, actie: 'LOGIN_FOUT', entiteit: 'User', entiteitId: user.id, details: { pogingenOver: MAX_LOGIN_POGINGEN - nieuwePogingenCount }, ipAdres: getIp(req) })
    return res.json({ result: 'fout', pogingenOver: MAX_LOGIN_POGINGEN - nieuwePogingenCount })
  }

  if (!user.actief) return res.json({ result: 'wacht' })

  // Succesvolle login — reset lockout tellers
  const now = new Date().toISOString()
  await prisma.user.update({
    where: { id: user.id },
    data: { laatstIngelogd: now, loginPogingen: 0, geblokkerdTot: null },
  })
  logAuditEvent({ userId: user.id, userNaam: user.naam, userRol: user.rol, actie: 'LOGIN_OK', entiteit: 'User', entiteitId: user.id, ipAdres: getIp(req) })

  const token = jwt.sign(
    { userId: user.id, naam: user.naam, rol: user.rol, pelotoonId: user.pelotoonId, groepId: user.groepId ?? null },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  })

  res.json({ result: 'ok', user: formatUser({ ...user, taken: user.taken, laatstIngelogd: now }) })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  logAuditEvent({ userId: req.user.userId, userNaam: req.user.naam, userRol: req.user.rol, actie: 'LOGOUT', ipAdres: getIp(req) })
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: USER_INCLUDE,
  })
  if (!user || !user.actief) {
    res.clearCookie(COOKIE_NAME)
    return res.status(401).json({ error: 'Gebruiker niet gevonden of inactief' })
  }
  res.json(formatUser(user))
})

// POST /api/auth/register
router.post('/register', validate({
  naam:      { required: true, maxLength: 100 },
  email:     { required: true, email: true, maxLength: 255 },
  pin:       { required: true, pin: true },
  pelotoonId:{ required: true },
}), async (req, res) => {
  const { naam, email, pin, pelotoonId, groepId } = req.body

  const peloton = await prisma.peloton.findUnique({ where: { id: pelotoonId } })
  if (!peloton) return res.status(400).json({ error: 'Ongeldig peloton' })

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
      pelotoonId,
      groepId: groepId || null,
      aangemeldOp: new Date().toISOString().split('T')[0],
      actief: false,
      taken: {
        create: alleTaken.map(t => ({ taakId: t.id })),
      },
    },
    include: USER_INCLUDE,
  })

  const cfg = await prisma.appConfig.findFirst({ where: { id: 1 } })
  const adminEmail = cfg?.emailAdmin || process.env.EMAIL_ADMIN || process.env.EMAIL_USER
  verstuurEmail('registratie', user.email, { naam })
  if (adminEmail) verstuurEmail('registratie_admin', adminEmail, { naam, email: user.email, pelotoon: peloton.naam })

  logAuditEvent({ userId: user.id, userNaam: naam, userRol: 'reservist', actie: 'REGISTRATIE', entiteit: 'User', entiteitId: user.id, details: { email: user.email, pelotoon: peloton.naam }, ipAdres: getIp(req) })
  res.json({ ok: true })
})

// POST /api/auth/pin-reset/aanvragen
router.post('/pin-reset/aanvragen', validate({
  email: { required: true, email: true, maxLength: 255 },
}), async (req, res) => {
  const { email } = req.body

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
  logAuditEvent({ userId: user.id, userNaam: user.naam, userRol: user.rol, actie: 'PIN_RESET_AANGEVRAAGD', entiteit: 'User', entiteitId: user.id, ipAdres: getIp(req) })
})

// POST /api/auth/pin-reset/toepassen
router.post('/pin-reset/toepassen', validate({
  token: { required: true },
  pin:   { required: true, pin: true },
}), async (req, res) => {
  const { token, pin } = req.body

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
  const gereset = await prisma.user.findUnique({ where: { email: record.email } })
  if (gereset) logAuditEvent({ userId: gereset.id, userNaam: gereset.naam, userRol: gereset.rol, actie: 'PIN_RESET_UITGEVOERD', entiteit: 'User', entiteitId: gereset.id, ipAdres: getIp(req) })

  res.json({ ok: true })
})

export default router
