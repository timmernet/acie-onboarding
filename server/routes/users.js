import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma.js'
import { verstuurEmail } from '../email.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'

const router = Router()

const USER_INCLUDE = { taken: true, peloton: true, groep: true }

function formatUser(user) {
  const { pin, taken: rawTaken, peloton, groep, ...rest } = user
  return {
    ...rest,
    pelotoonNaam: peloton?.naam ?? '',
    groepNaam: groep?.naam ?? null,
    taken: (rawTaken ?? []).map(t => ({
      taskId: t.taakId,
      voltooid: t.voltooid,
      voltooiDatum: t.voltooiDatum ?? undefined,
      opmerking: t.opmerking ?? undefined,
      nieuw: t.nieuw,
    })),
  }
}

/** Bouw een Prisma where-filter op basis van de rol van de aanvrager */
function scopeWhere(reqUser) {
  const { rol, pelotoonId, groepId } = reqUser
  if (rol === 'beheerder') return {}
  if (rol === 'commandant') return { pelotoonId, rol: { not: 'beheerder' } }
  if (rol === 'groepscommandant') {
    if (!groepId) return { id: 'nooit' } // geen groep → niets tonen
    return { groepId }
  }
  return { id: 'nooit' }
}

/** Verifieer dat de doelgebruiker binnen het bereik van de aanvrager valt */
async function inScope(reqUser, targetId) {
  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) return false
  const { rol, pelotoonId, groepId } = reqUser
  if (rol === 'beheerder') return true
  if (rol === 'commandant') return target.pelotoonId === pelotoonId && target.rol !== 'beheerder'
  if (rol === 'groepscommandant') return target.groepId === groepId
  return false
}

const SCHRIJF_ROLLEN = ['commandant', 'beheerder', 'groepscommandant']

// GET /api/users
router.get('/', requireAuth, requireRol('commandant', 'beheerder', 'groepscommandant'), async (req, res) => {
  const users = await prisma.user.findMany({
    where: scopeWhere(req.user),
    include: USER_INCLUDE,
    orderBy: { aangemeldOp: 'asc' },
  })
  res.json(users.map(formatUser))
})

const gebruikerSchema = {
  naam:      { required: true, maxLength: 100 },
  email:     { required: true, email: true, maxLength: 255 },
  pelotoonId:{ required: true },
  rol:       { required: true, enum: ['reservist', 'groepscommandant', 'commandant', 'beheerder'] },
}

// POST /api/users
router.post('/', requireAuth, requireRol(...SCHRIJF_ROLLEN), validate(gebruikerSchema), async (req, res) => {
  const { naam, email, pelotoonId, groepId, rol, actief } = req.body
  if (!naam || !email || !pelotoonId || !rol) {
    return res.status(400).json({ error: 'naam, email, pelotoonId en rol zijn verplicht' })
  }

  const { rol: aanvragerRol, pelotoonId: aanvragerPelotoon, groepId: aanvragerGroep } = req.user

  // Scoping-afdwinging
  if (aanvragerRol === 'commandant') {
    if (pelotoonId !== aanvragerPelotoon) return res.status(403).json({ error: 'Je kunt alleen gebruikers aanmaken in je eigen peloton' })
    if (rol === 'beheerder' || rol === 'commandant') return res.status(403).json({ error: 'Je mag deze rol niet toewijzen' })
  }
  if (aanvragerRol === 'groepscommandant') {
    if (pelotoonId !== aanvragerPelotoon || groepId !== aanvragerGroep) return res.status(403).json({ error: 'Je kunt alleen gebruikers aanmaken in je eigen groep' })
    if (rol !== 'reservist') return res.status(403).json({ error: 'Je mag alleen de rol reservist toewijzen' })
  }

  const bestaand = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (bestaand) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' })

  const tijdelijkePin = await bcrypt.hash('0000', 10)
  const alleTaken = await prisma.taak.findMany()

  const user = await prisma.user.create({
    data: {
      naam,
      email: email.toLowerCase(),
      pin: tijdelijkePin,
      rol,
      pelotoonId,
      groepId: groepId || null,
      aangemeldOp: new Date().toISOString().split('T')[0],
      actief: actief ?? true,
      taken: { create: alleTaken.map(t => ({ taakId: t.id })) },
    },
    include: USER_INCLUDE,
  })

  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const expires = BigInt(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.pinResetToken.create({ data: { token, email: email.toLowerCase(), naam, expires } })
  const appUrl = process.env.APP_URL || 'http://localhost:5173'
  verstuurEmail('pin-reset', email.toLowerCase(), { naam, resetUrl: `${appUrl}/pin-reset?token=${token}` })

  logAuditEvent({ ...actor(req), actie: 'USER_AANGEMAAKT', entiteit: 'User', entiteitId: user.id, details: { naam, email: user.email, rol } })
  res.json(formatUser(user))
})

// PUT /api/users/:id
router.put('/:id', requireAuth, requireRol(...SCHRIJF_ROLLEN), validate(gebruikerSchema), async (req, res) => {
  const { naam, email, pelotoonId, groepId, rol, actief } = req.body
  if (!naam || !email || !pelotoonId || !rol) {
    return res.status(400).json({ error: 'naam, email, pelotoonId en rol zijn verplicht' })
  }

  if (!await inScope(req.user, req.params.id)) return res.status(403).json({ error: 'Geen toegang tot deze gebruiker' })

  const { rol: aanvragerRol, pelotoonId: aanvragerPelotoon, groepId: aanvragerGroep } = req.user
  if (aanvragerRol === 'commandant') {
    if (pelotoonId !== aanvragerPelotoon) return res.status(403).json({ error: 'Je kunt gebruikers niet naar een ander peloton verplaatsen' })
    if (rol === 'beheerder' || rol === 'commandant') return res.status(403).json({ error: 'Je mag deze rol niet toewijzen' })
  }
  if (aanvragerRol === 'groepscommandant') {
    if (groepId !== aanvragerGroep) return res.status(403).json({ error: 'Je kunt gebruikers niet naar een andere groep verplaatsen' })
    if (rol !== 'reservist') return res.status(403).json({ error: 'Je mag alleen de rol reservist toewijzen' })
  }

  const conflict = await prisma.user.findFirst({ where: { email: email.toLowerCase(), NOT: { id: req.params.id } } })
  if (conflict) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' })

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { naam, email: email.toLowerCase(), pelotoonId, groepId: groepId || null, rol, actief: actief ?? true },
    include: USER_INCLUDE,
  })
  logAuditEvent({ ...actor(req), actie: 'USER_BIJGEWERKT', entiteit: 'User', entiteitId: user.id, details: { naam, rol, actief } })
  res.json(formatUser(user))
})

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireRol(...SCHRIJF_ROLLEN), async (req, res) => {
  if (req.params.id === req.user.userId) return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' })
  if (!await inScope(req.user, req.params.id)) return res.status(403).json({ error: 'Geen toegang tot deze gebruiker' })
  const teVerwijderen = await prisma.user.findUnique({ where: { id: req.params.id } })
  await prisma.user.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'USER_VERWIJDERD', entiteit: 'User', entiteitId: req.params.id, details: { naam: teVerwijderen?.naam, email: teVerwijderen?.email } })
  res.json({ ok: true })
})

// PATCH /api/users/:id/activeer
router.patch('/:id/activeer', requireAuth, requireRol(...SCHRIJF_ROLLEN), async (req, res) => {
  if (!await inScope(req.user, req.params.id)) return res.status(403).json({ error: 'Geen toegang' })
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { actief: true } })
  verstuurEmail('activatie', user.email, { naam: user.naam })
  logAuditEvent({ ...actor(req), actie: 'USER_GEACTIVEERD', entiteit: 'User', entiteitId: user.id, details: { naam: user.naam } })
  res.json({ ok: true })
})

// PATCH /api/users/:id/deactiveer
router.patch('/:id/deactiveer', requireAuth, requireRol(...SCHRIJF_ROLLEN), async (req, res) => {
  if (!await inScope(req.user, req.params.id)) return res.status(403).json({ error: 'Geen toegang' })
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { actief: false } })
  logAuditEvent({ ...actor(req), actie: 'USER_GEDEACTIVEERD', entiteit: 'User', entiteitId: user.id, details: { naam: user.naam } })
  res.json({ ok: true })
})

// PATCH /api/users/:id/afwijzen
router.patch('/:id/afwijzen', requireAuth, requireRol(...SCHRIJF_ROLLEN), async (req, res) => {
  if (!await inScope(req.user, req.params.id)) return res.status(403).json({ error: 'Geen toegang' })
  const teAfwijzen = await prisma.user.findUnique({ where: { id: req.params.id } })
  await prisma.user.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'USER_AFGEWEZEN', entiteit: 'User', entiteitId: req.params.id, details: { naam: teAfwijzen?.naam, email: teAfwijzen?.email } })
  res.json({ ok: true })
})

export default router
