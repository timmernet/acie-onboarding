import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

const UPLOADS_DIR = join(__dirname, 'uploads')
const DATA_FILE = join(__dirname, 'bestanden.json')

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, '[]')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

function loadMeta() {
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function saveMeta(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

app.get('/api/bestanden', (req, res) => {
  res.json(loadMeta())
})

app.post('/api/bestanden', upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Geen bestand meegegeven' })

  const id = `d_${Date.now()}`
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${id}_${safeName}`

  writeFileSync(join(UPLOADS_DIR, filename), file.buffer)

  const bestand = {
    id,
    naam: req.body.naam?.trim() || file.originalname,
    beschrijving: req.body.beschrijving || '',
    categorie: req.body.categorie || '',
    bestandsnaam: file.originalname,
    bestandstype: file.mimetype,
    grootte: file.size,
    geuploadOp: new Date().toISOString(),
    geuploadDoor: req.body.geuploadDoor || 'Onbekend',
    url: `/uploads/${filename}`,
  }

  const meta = loadMeta()
  meta.push(bestand)
  saveMeta(meta)

  res.json(bestand)
})

app.delete('/api/bestanden/:id', (req, res) => {
  const meta = loadMeta()
  const idx = meta.findIndex(b => b.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Niet gevonden' })

  const bestand = meta[idx]
  const bestandsnaam = bestand.url.replace('/uploads/', '')
  const filepath = join(UPLOADS_DIR, bestandsnaam)
  if (existsSync(filepath)) unlinkSync(filepath)

  meta.splice(idx, 1)
  saveMeta(meta)

  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`API server draait op http://localhost:${PORT}`)
})
