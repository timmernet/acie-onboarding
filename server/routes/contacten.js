import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { validate } from '../validate.js'

const router = Router()

function formatContact(c) {
  return { ...c, tags: JSON.parse(c.tags || '[]') }
}

// GET /api/contacten
router.get('/', requireAuth, async (req, res) => {
  const contacten = await prisma.contact.findMany({ orderBy: { naam: 'asc' } })
  res.json(contacten.map(formatContact))
})

const contactSchema = {
  naam:    { required: true, maxLength: 100 },
  email:   { email: true, maxLength: 255 },
  telefoon:{ maxLength: 30 },
  rang:    { maxLength: 50 },
  functie: { maxLength: 100 },
}

// POST /api/contacten
router.post('/', requireAuth, requireRol('commandant', 'beheerder'), validate(contactSchema), async (req, res) => {
  const { naam, rang, functie, telefoon, email, tags } = req.body
  if (!naam) return res.status(400).json({ error: 'naam is verplicht' })
  const contact = await prisma.contact.create({
    data: { naam, rang: rang || '', functie: functie || '', telefoon: telefoon || '', email: email || '', tags: JSON.stringify(tags || []) },
  })
  res.json(formatContact(contact))
})

// PUT /api/contacten/:id
router.put('/:id', requireAuth, requireRol('commandant', 'beheerder'), validate(contactSchema), async (req, res) => {
  const { naam, rang, functie, telefoon, email, tags } = req.body
  if (!naam) return res.status(400).json({ error: 'naam is verplicht' })
  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data: { naam, rang: rang || '', functie: functie || '', telefoon: telefoon || '', email: email || '', tags: JSON.stringify(tags || []) },
  })
  res.json(formatContact(contact))
})

// DELETE /api/contacten/:id
router.delete('/:id', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  await prisma.contact.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
