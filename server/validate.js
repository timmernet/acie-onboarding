/**
 * Lichtgewicht validatie-middleware factory.
 * Gebruik: router.post('/', validate(schema), handler)
 *
 * Regels per veld:
 *   required   – verplicht, mag niet leeg zijn
 *   maxLength  – maximaal N tekens
 *   email      – geldig e-mailadres
 *   pin        – precies 4 cijfers
 *   hex        – geldige CSS-kleurcode (#xxx of #xxxxxx)
 *   port       – geheel getal 1-65535
 *   enum       – waarde moet in de lijst staan
 *   url        – geldige URL (optioneel veld)
 */
export function validate(schema) {
  return (req, res, next) => {
    const fouten = []

    for (const [veld, regels] of Object.entries(schema)) {
      const waarde = req.body[veld]
      const leeg = waarde === undefined || waarde === null || String(waarde).trim() === ''

      if (regels.required && leeg) {
        fouten.push(`'${veld}' is verplicht`)
        continue
      }

      if (leeg) continue

      const str = String(waarde).trim()

      if (regels.maxLength && str.length > regels.maxLength) {
        fouten.push(`'${veld}' mag maximaal ${regels.maxLength} tekens bevatten`)
      }
      if (regels.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str)) {
        fouten.push(`'${veld}' is geen geldig e-mailadres`)
      }
      if (regels.pin && !/^\d{4}$/.test(str)) {
        fouten.push(`'${veld}' moet precies 4 cijfers zijn`)
      }
      if (regels.hex && !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(str)) {
        fouten.push(`'${veld}' is geen geldige kleurcode (bijv. #3f7a22)`)
      }
      if (regels.port) {
        const n = Number(str)
        if (!Number.isInteger(n) || n < 1 || n > 65535) {
          fouten.push(`'${veld}' moet een geldig poortnummer zijn (1-65535)`)
        }
      }
      if (regels.enum && !regels.enum.includes(str)) {
        fouten.push(`'${veld}' heeft een ongeldige waarde (toegestaan: ${regels.enum.join(', ')})`)
      }
      if (regels.url && str !== '') {
        try { new URL(str) } catch {
          fouten.push(`'${veld}' is geen geldige URL`)
        }
      }
    }

    if (fouten.length > 0) {
      return res.status(400).json({ error: fouten.join('; ') })
    }
    next()
  }
}
