import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'

const router = Router()

// GET /api/pelotonen — alle ingelogde gebruikers (nodig voor registratieformulier)
router.get('/', requireAuth, async (req, res) => {
  const pelotonen = await prisma.peloton.findMany({ orderBy: { naam: 'asc' } })
  res.json(pelotonen)
})

const naamSchema = { naam: { required: true, maxLength: 100 } }

// POST /api/pelotonen — beheerder only
router.post('/', requireAuth, requireRol('beheerder'), validate(naamSchema), async (req, res) => {
  const { naam } = req.body
  if (!naam?.trim()) return res.status(400).json({ error: 'naam is verplicht' })
  const bestaand = await prisma.peloton.findUnique({ where: { naam: naam.trim() } })
  if (bestaand) return res.status(409).json({ error: 'Er bestaat al een peloton met deze naam' })
  const peloton = await prisma.peloton.create({ data: { naam: naam.trim() } })
  logAuditEvent({ ...actor(req), actie: 'PELOTON_AANGEMAAKT', entiteit: 'Peloton', entiteitId: peloton.id, details: { naam: peloton.naam } })
  res.json(peloton)
})

// PUT /api/pelotonen/:id — beheerder only
router.put('/:id', requireAuth, requireRol('beheerder'), validate(naamSchema), async (req, res) => {
  const { naam } = req.body
  if (!naam?.trim()) return res.status(400).json({ error: 'naam is verplicht' })
  const conflict = await prisma.peloton.findFirst({ where: { naam: naam.trim(), NOT: { id: req.params.id } } })
  if (conflict) return res.status(409).json({ error: 'Er bestaat al een peloton met deze naam' })
  const peloton = await prisma.peloton.update({ where: { id: req.params.id }, data: { naam: naam.trim() } })
  logAuditEvent({ ...actor(req), actie: 'PELOTON_BIJGEWERKT', entiteit: 'Peloton', entiteitId: peloton.id, details: { naam: peloton.naam } })
  res.json(peloton)
})

// DELETE /api/pelotonen/:id — beheerder only
router.delete('/:id', requireAuth, requireRol('beheerder'), async (req, res) => {
  const gebruikersCount = await prisma.user.count({ where: { pelotoonId: req.params.id } })
  if (gebruikersCount > 0) return res.status(409).json({ error: 'Peloton heeft nog gebruikers — verplaats of verwijder deze eerst' })
  const groepenCount = await prisma.groep.count({ where: { pelotoonId: req.params.id } })
  if (groepenCount > 0) return res.status(409).json({ error: 'Peloton heeft nog groepen — verwijder deze eerst' })
  const teVerwijderen = await prisma.peloton.findUnique({ where: { id: req.params.id } })
  await prisma.peloton.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'PELOTON_VERWIJDERD', entiteit: 'Peloton', entiteitId: req.params.id, details: { naam: teVerwijderen?.naam } })
  res.json({ ok: true })
})

export default router
