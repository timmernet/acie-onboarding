import { Router } from 'express'
import multer from 'multer'
import { writeFileSync, existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'
import { logAuditEvent, actor } from '../audit.js'
import { valideerDocument } from '../fileValidation.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', 'uploads')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
})

const router = Router()

// GET /api/bestanden
router.get('/', requireAuth, async (req, res) => {
  const bestanden = await prisma.bestand.findMany({ orderBy: { geuploadOp: 'desc' } })
  res.json(bestanden)
})

// POST /api/bestanden
router.post('/', requireAuth, requireRol('commandant', 'beheerder'), upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Geen bestand meegegeven' })

  try {
    valideerDocument(file.buffer, file.originalname)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}_${safeName}`

  writeFileSync(join(UPLOADS_DIR, filename), file.buffer)

  const bestand = await prisma.bestand.create({
    data: {
      naam: req.body.naam?.trim() || file.originalname,
      beschrijving: req.body.beschrijving || '',
      categorie: req.body.categorie || '',
      bestandsnaam: file.originalname,
      bestandstype: file.mimetype,
      grootte: file.size,
      geuploadOp: new Date().toISOString(),
      geuploadDoor: req.body.geuploadDoor || 'Onbekend',
      url: `/uploads/${filename}`,
    },
  })
  logAuditEvent({ ...actor(req), actie: 'BESTAND_GEUPLOAD', entiteit: 'Bestand', entiteitId: bestand.id, details: { naam: bestand.naam, grootte: bestand.grootte } })
  res.json(bestand)
})

// DELETE /api/bestanden/:id
router.delete('/:id', requireAuth, requireRol('commandant', 'beheerder'), async (req, res) => {
  const bestand = await prisma.bestand.findUnique({ where: { id: req.params.id } })
  if (!bestand) return res.status(404).json({ error: 'Niet gevonden' })

  const filename = bestand.url.replace('/uploads/', '')
  const filepath = join(UPLOADS_DIR, filename)
  if (existsSync(filepath)) unlinkSync(filepath)

  await prisma.bestand.delete({ where: { id: req.params.id } })
  logAuditEvent({ ...actor(req), actie: 'BESTAND_VERWIJDERD', entiteit: 'Bestand', entiteitId: req.params.id, details: { naam: bestand.naam } })
  res.json({ ok: true })
})

export default router
