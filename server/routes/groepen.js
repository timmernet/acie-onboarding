import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'

const router = Router()

// GET /api/groepen — gefilterd op rol
router.get('/', requireAuth, async (req, res) => {
  const { rol, pelotoonId } = req.user
  let where = {}
  if (rol === 'commandant') where = { pelotoonId }
  else if (rol === 'groepscommandant') where = { id: req.user.groepId ?? 'nooit' }
  // beheerder ziet alles; reservist ziet alles (nodig voor registratie)
  const groepen = await prisma.groep.findMany({
    where,
    include: { peloton: true },
    orderBy: [{ pelotoonId: 'asc' }, { naam: 'asc' }],
  })
  res.json(groepen.map(g => ({ id: g.id, naam: g.naam, pelotoonId: g.pelotoonId, pelotoonNaam: g.peloton.naam })))
})

// POST /api/groepen — beheerder of commandant (binnen eigen peloton)
router.post('/', requireAuth, requireRol('beheerder', 'commandant'), validate({
  naam:      { required: true, maxLength: 100 },
  pelotoonId:{ required: true },
}), async (req, res) => {
  const { naam, pelotoonId } = req.body
  if (!naam?.trim() || !pelotoonId) return res.status(400).json({ error: 'naam en pelotoonId zijn verplicht' })

  if (req.user.rol === 'commandant' && pelotoonId !== req.user.pelotoonId) {
    return res.status(403).json({ error: 'Je kunt alleen groepen aanmaken in je eigen peloton' })
  }

  const bestaand = await prisma.groep.findFirst({ where: { naam: naam.trim(), pelotoonId } })
  if (bestaand) return res.status(409).json({ error: 'Er bestaat al een groep met deze naam in dit peloton' })

  const groep = await prisma.groep.create({
    data: { naam: naam.trim(), pelotoonId },
    include: { peloton: true },
  })
  logAuditEvent({ ...actor(req), actie: 'GROEP_AANGEMAAKT', entiteit: 'Groep', entiteitId: groep.id, details: { naam: groep.naam, pelotoonNaam: groep.peloton.naam } })
  res.json({ id: groep.id, naam: groep.naam, pelotoonId: groep.pelotoonId, pelotoonNaam: groep.peloton.naam })
})

// PUT /api/groepen/:id — beheerder of commandant
router.put('/:id', requireAuth, requireRol('beheerder', 'commandant'), validate({
  naam: { required: true, maxLength: 100 },
}), async (req, res) => {
  const { naam } = req.body
  if (!naam?.trim()) return res.status(400).json({ error: 'naam is verplicht' })

  const groep = await prisma.groep.findUnique({ where: { id: req.params.id } })
  if (!groep) return res.status(404).json({ error: 'Groep niet gevonden' })

  if (req.user.rol === 'commandant' && groep.pelotoonId !== req.user.pelotoonId) {
    return res.status(403).json({ error: 'Geen toegang tot deze groep' })
  }

  const conflict = await prisma.groep.findFirst({ where: { naam: naam.trim(), pelotoonId: groep.pelotoonId, NOT: { id: req.params.id } } })
  if (conflict) return res.status(409).json({ error: 'Er bestaat al een groep met deze naam in dit peloton' })

  const bijgewerkt = await prisma.groep.update({
    where: { id: req.params.id },
    data: { naam: naam.trim() },
    include: { peloton: true },
  })
  logAuditEvent({ ...actor(req), actie: 'GROEP_BIJGEWERKT', entiteit: 'Groep', entiteitId: bijgewerkt.id, details: { naam: bijgewerkt.naam, pelotoonNaam: bijgewerkt.peloton.naam } })
  res.json({ id: bijgewerkt.id, naam: bijgewerkt.naam, pelotoonId: bijgewerkt.pelotoonId, pelotoonNaam: bijgewerkt.peloton.naam })
})

// DELETE /api/groepen/:id — beheerder of commandant
router.delete('/:id', requireAuth, requireRol('beheerder', 'commandant'), async (req, res) => {
  const groep = await prisma.groep.findUnique({ where: { id: req.params.id } })
  if (!groep) return res.status(404).json({ error: 'Groep niet gevonden' })

  if (req.user.rol === 'commandant' && groep.pelotoonId !== req.user.pelotoonId) {
    return res.status(403).json({ error: 'Geen toegang tot deze groep' })
  }

  const count = await prisma.user.count({ where: { groepId: req.params.id } })
  if (count > 0) return res.status(409).json({ error: 'Groep heeft nog gebruikers — verplaats of verwijder deze eerst' })

  await prisma.groep.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'GROEP_VERWIJDERD', entiteit: 'Groep', entiteitId: req.params.id, details: { naam: groep.naam } })
  res.json({ ok: true })
})

export default router
