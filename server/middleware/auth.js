import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'acie_dev_secret_verander_in_productie'
export const COOKIE_NAME = 'acie_session'
export const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000 // 8 uur

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'Niet ingelogd' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.clearCookie(COOKIE_NAME)
    res.status(401).json({ error: 'Sessie verlopen, log opnieuw in' })
  }
}

export function requireRol(...rollen) {
  return (req, res, next) => {
    if (!req.user || !rollen.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Geen toegang' })
    }
    next()
  }
}
