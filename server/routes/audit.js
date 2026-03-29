import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, requireRol } from '../middleware/auth.js'

const router = Router()

// GET /api/audit — beheerder only, paginering + optioneel filter
router.get('/', requireAuth, requireRol('beheerder'), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage) || 50))
  const skip = (page - 1) * perPage

  const where = {}
  if (req.query.actie) where.actie = req.query.actie
  if (req.query.userId) where.userId = req.query.userId
  if (req.query.entiteit) where.entiteit = req.query.entiteit

  const [logs, totaal] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { tijdstip: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ])

  res.json({
    logs: logs.map(l => ({ ...l, details: JSON.parse(l.details || '{}') })),
    totaal,
    pagina: page,
    perPagina: perPage,
    paginas: Math.ceil(totaal / perPage),
  })
})

export default router
