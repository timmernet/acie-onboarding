import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma.js'
import { verstuurEmail } from '../email.js'
import { requireAuth, requireRol } from '../middleware/auth.js'

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

// GET /api/users — commandant + beheerder
router.get('/', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const users = await prisma.user.findMany({
    include: { taken: true },
    orderBy: { aangemeldOp: 'asc' },
  })
  res.json(users.map(formatUser))
})

// POST /api/users — maak gebruiker aan (beheer)
router.post('/', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const { naam, email, pelotoon, rol, actief } = req.body
  if (!naam || !email || !pelotoon || !rol) {
    return res.status(400).json({ error: 'naam, email, pelotoon en rol zijn verplicht' })
  }

  // Commandant mag geen beheerder aanmaken
  if (req.user.rol === 'commandant' && rol === 'beheerder') {
    return res.status(403).json({ error: 'Commandanten mogen geen beheerders aanmaken' })
  }

  const bestaand = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (bestaand) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' })

  // Tijdelijke willekeurige pin (gebruiker stelt zelf in via reset-link)
  const tijdelijkePin = await bcrypt.hash('0000', 10)
  const alleTaken = await prisma.taak.findMany()

  const user = await prisma.user.create({
    data: {
      naam,
      email: email.toLowerCase(),
      pin: tijdelijkePin,
      rol,
      pelotoon,
      aangemeldOp: new Date().toISOString().split('T')[0],
      actief: actief ?? true,
      taken: {
        create: alleTaken.map(t => ({ taakId: t.id })),
      },
    },
    include: { taken: true },
  })

  // Stuur reset-link zodat de gebruiker zelf een pin kan instellen
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const expires = BigInt(Date.now() + 24 * 60 * 60 * 1000) // 24 uur voor admin-aangemaakte accounts
  await prisma.pinResetToken.create({
    data: { token, email: email.toLowerCase(), naam, expires },
  })
  const appUrl = process.env.APP_URL || 'http://localhost:5173'
  verstuurEmail('pin-reset', email.toLowerCase(), { naam, resetUrl: `${appUrl}/pin-reset?token=${token}` })

  res.json(formatUser(user))
})

// PUT /api/users/:id
router.put('/:id', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const { naam, email, pelotoon, rol, actief } = req.body
  if (!naam || !email || !pelotoon || !rol) {
    return res.status(400).json({ error: 'naam, email, pelotoon en rol zijn verplicht' })
  }

  if (req.user.rol === 'commandant' && rol === 'beheerder') {
    return res.status(403).json({ error: 'Commandanten mogen geen beheerder-rol toewijzen' })
  }

  const conflict = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), NOT: { id: req.params.id } },
  })
  if (conflict) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' })

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { naam, email: email.toLowerCase(), pelotoon, rol, actief: actief ?? true },
    include: { taken: true },
  })
  res.json(formatUser(user))
})

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' })
  }
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// PATCH /api/users/:id/activeer
router.patch('/:id/activeer', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { actief: true },
  })
  verstuurEmail('activatie', user.email, { naam: user.naam })
  res.json({ ok: true })
})

// PATCH /api/users/:id/deactiveer
router.patch('/:id/deactiveer', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { actief: false } })
  res.json({ ok: true })
})

// PATCH /api/users/:id/afwijzen
router.patch('/:id/afwijzen', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
