import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { validate } from '../validate.js'

const router = Router()

// GET /api/taken — taakdefinities (voor alle ingelogde gebruikers)
router.get('/', requireAuth, async (req, res) => {
  const taken = await prisma.taak.findMany({ orderBy: { volgorde: 'asc' } })
  res.json(taken)
})

const taakSchema = {
  titel:       { required: true, maxLength: 200 },
  beschrijving:{ required: true, maxLength: 2000 },
  categorie:   { required: true, maxLength: 100 },
}

// POST /api/taken
router.post('/', requireAuth, requireRol('commandant', 'beheerder'), validate(taakSchema), async (req, res) => {
  const { titel, beschrijving, categorie, contactId, vereistTaakId } = req.body
  if (!titel || !beschrijving || !categorie) {
    return res.status(400).json({ error: 'titel, beschrijving en categorie zijn verplicht' })
  }

  const maxVolgorde = await prisma.taak.aggregate({ _max: { volgorde: true } })
  const volgorde = (maxVolgorde._max.volgorde ?? -1) + 1

  const taak = await prisma.taak.create({
    data: {
      titel,
      beschrijving,
      categorie,
      contactId: contactId || '',
      vereistTaakId: vereistTaakId || null,
      volgorde,
    },
  })

  // Maak UserTask aan voor alle bestaande gebruikers met nieuw: true
  const users = await prisma.user.findMany({ select: { id: true } })
  await prisma.userTask.createMany({
    data: users.map(u => ({ userId: u.id, taakId: taak.id, nieuw: true })),
    skipDuplicates: true,
  })

  logAuditEvent({ ...actor(req), actie: 'TAAK_AANGEMAAKT', entiteit: 'Taak', entiteitId: taak.id, details: { titel, categorie } })
  res.json(taak)
})

// PUT /api/taken/:id
router.put('/:id', requireAuth, requireRol('commandant', 'beheerder'), validate(taakSchema), async (req, res) => {
  const { titel, beschrijving, categorie, contactId, vereistTaakId } = req.body
  if (!titel || !beschrijving || !categorie) {
    return res.status(400).json({ error: 'titel, beschrijving en categorie zijn verplicht' })
  }
  const taak = await prisma.taak.update({
    where: { id: req.params.id },
    data: { titel, beschrijving, categorie, contactId: contactId || '', vereistTaakId: vereistTaakId || null },
  })
  logAuditEvent({ ...actor(req), actie: 'TAAK_BIJGEWERKT', entiteit: 'Taak', entiteitId: taak.id, details: { titel, categorie } })
  res.json(taak)
})

// DELETE /api/taken/:id
router.delete('/:id', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  // Verwijder vereistTaakId-referenties naar deze taak
  const teVerwijderen = await prisma.taak.findUnique({ where: { id: req.params.id } })
  await prisma.taak.updateMany({
    where: { vereistTaakId: req.params.id },
    data: { vereistTaakId: null },
  })
  await prisma.taak.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'TAAK_VERWIJDERD', entiteit: 'Taak', entiteitId: req.params.id, details: { titel: teVerwijderen?.titel } })
  res.json({ ok: true })
})

// PATCH /api/taken/:id/omhoog
router.patch('/:id/omhoog', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const taken = await prisma.taak.findMany({ orderBy: { volgorde: 'asc' } })
  const idx = taken.findIndex(t => t.id === req.params.id)
  if (idx <= 0) return res.json({ ok: true })

  await prisma.$transaction([
    prisma.taak.update({ where: { id: taken[idx].id }, data: { volgorde: taken[idx - 1].volgorde } }),
    prisma.taak.update({ where: { id: taken[idx - 1].id }, data: { volgorde: taken[idx].volgorde } }),
  ])
  res.json({ ok: true })
})

// PATCH /api/taken/:id/omlaag
router.patch('/:id/omlaag', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const taken = await prisma.taak.findMany({ orderBy: { volgorde: 'asc' } })
  const idx = taken.findIndex(t => t.id === req.params.id)
  if (idx < 0 || idx >= taken.length - 1) return res.json({ ok: true })

  await prisma.$transaction([
    prisma.taak.update({ where: { id: taken[idx].id }, data: { volgorde: taken[idx + 1].volgorde } }),
    prisma.taak.update({ where: { id: taken[idx + 1].id }, data: { volgorde: taken[idx].volgorde } }),
  ])
  res.json({ ok: true })
})

// PATCH /api/taken/:id/toggle — eigen voortgang
router.patch('/:id/toggle', requireAuth, async (req, res) => {
  const bestaand = await prisma.userTask.findUnique({
    where: { userId_taakId: { userId: req.user.userId, taakId: req.params.id } },
  })
  if (!bestaand) return res.status(404).json({ error: 'Taak niet gevonden' })

  const nieuweWaarde = !bestaand.voltooid
  const updated = await prisma.userTask.update({
    where: { userId_taakId: { userId: req.user.userId, taakId: req.params.id } },
    data: {
      voltooid: nieuweWaarde,
      voltooiDatum: nieuweWaarde ? new Date().toISOString().split('T')[0] : null,
    },
  })
  logAuditEvent({ ...actor(req), actie: nieuweWaarde ? 'TAAK_VOLTOOID' : 'TAAK_HEROPEND', entiteit: 'UserTask', entiteitId: updated.id, details: { taakId: req.params.id } })
  res.json({
    taskId: updated.taakId,
    voltooid: updated.voltooid,
    voltooiDatum: updated.voltooiDatum ?? undefined,
  })
})

// PATCH /api/taken/:id/opmerking
router.patch('/:id/opmerking', requireAuth, async (req, res) => {
  const { opmerking } = req.body
  const updated = await prisma.userTask.update({
    where: { userId_taakId: { userId: req.user.userId, taakId: req.params.id } },
    data: { opmerking: opmerking || null },
  })
  res.json({ taskId: updated.taakId, opmerking: updated.opmerking ?? undefined })
})

// PATCH /api/taken/:id/gezien
router.patch('/:id/gezien', requireAuth, async (req, res) => {
  await prisma.userTask.update({
    where: { userId_taakId: { userId: req.user.userId, taakId: req.params.id } },
    data: { nieuw: false },
  })
  res.json({ ok: true })
})

export default router
