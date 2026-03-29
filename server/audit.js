import { prisma } from './prisma.js'

/**
 * Schrijf een audit-entry. Fouten blokkeren de applicatie nooit.
 * @param {object} opts
 * @param {string|null}  opts.userId      - ID van de handelende gebruiker (null = systeem/anoniem)
 * @param {string}       opts.userNaam    - Naam op moment van handeling
 * @param {string}       opts.userRol     - Rol op moment van handeling
 * @param {string}       opts.actie       - Bijv. 'LOGIN_OK', 'USER_VERWIJDERD'
 * @param {string|null}  opts.entiteit    - Bijv. 'User', 'Taak', 'Peloton'
 * @param {string|null}  opts.entiteitId  - ID van het getroffen record
 * @param {object}       opts.details     - Extra context (naam, velden, etc.)
 * @param {string|null}  opts.ipAdres     - IP-adres van de aanvrager
 */
export async function logAuditEvent({
  userId = null,
  userNaam = 'Anoniem',
  userRol = 'anoniem',
  actie,
  entiteit = null,
  entiteitId = null,
  details = {},
  ipAdres = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tijdstip: new Date().toISOString(),
        userId,
        userNaam,
        userRol,
        actie,
        entiteit,
        entiteitId,
        details: JSON.stringify(details),
        ipAdres,
      },
    })
  } catch (err) {
    console.error('[AuditLog] Schrijven mislukt:', err.message)
  }
}

/** Haal IP-adres op uit een Express request (ondersteunt reverse proxy). */
export function getIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    null
  )
}

/** Bouw audit-actor op uit req.user (na authenticatie). */
export function actor(req) {
  return {
    userId: req.user?.userId ?? null,
    userNaam: req.user?.naam ?? 'Onbekend',
    userRol: req.user?.rol ?? 'onbekend',
    ipAdres: getIp(req),
  }
}
