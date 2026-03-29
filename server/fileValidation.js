/**
 * Bestandsvalidatie op basis van magic bytes (bestandshandtekening).
 * Voorkomt dat kwaadaardige bestanden worden geüpload door alleen op
 * de bestandsextensie of de door de client opgegeven MIME-type te vertrouwen.
 */

const HANDTEKENINGEN = [
  { mime: 'image/jpeg',       bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',        bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif',        bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp',       bytes: [0x52, 0x49, 0x46, 0x46], extraOffset: 8, extraBytes: [0x57, 0x45, 0x42, 0x50] },
  { mime: 'image/x-icon',     bytes: [0x00, 0x00, 0x01, 0x00] },
  { mime: 'application/pdf',  bytes: [0x25, 0x50, 0x44, 0x46] },
  // ZIP-container: DOCX, XLSX, PPTX, ODT, ODS, ODP
  { mime: 'application/zip',  bytes: [0x50, 0x4B, 0x03, 0x04] },
  // OLE2-container: DOC, XLS, PPT
  { mime: 'application/ole2', bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
]

// MIME-types die als afbeelding worden geaccepteerd (ook SVG via tekst-check)
const AFBEELDING_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/x-icon', 'image/svg+xml',
])

// MIME-types voor algemene documenten
const DOCUMENT_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/zip',         // DOCX, XLSX, PPTX, ODT, ODS
  'application/ole2',        // DOC, XLS, PPT
])

// Toegestane bestandsextensies voor documenten
const DOCUMENT_EXTENSIES = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp',
  '.doc', '.xls', '.ppt',
  '.txt',
])

function detecteerMime(buffer) {
  for (const sig of HANDTEKENINGEN) {
    const match = sig.bytes.every((b, i) => buffer[i] === b)
    if (!match) continue
    if (sig.extraBytes) {
      const extra = sig.extraBytes.every((b, i) => buffer[sig.extraOffset + i] === b)
      if (!extra) continue
    }
    return sig.mime
  }
  // SVG: tekstgebaseerd, controleer begin van bestand
  const tekst = buffer.slice(0, 256).toString('utf8').trimStart()
  if (tekst.startsWith('<svg') || tekst.startsWith('<?xml')) return 'image/svg+xml'
  // Platte tekst: geen nul-bytes in eerste 512 bytes
  const sample = buffer.slice(0, 512)
  if (!sample.includes(0x00)) return 'text/plain'
  return null
}

/**
 * Valideer een geüploade afbeelding (logo, favicon).
 * Gooit een Error als het bestand niet voldoet.
 */
export function valideerAfbeelding(buffer, maxBytes = 2 * 1024 * 1024) {
  if (buffer.length > maxBytes) {
    throw new Error(`Bestand te groot (maximum ${Math.round(maxBytes / 1024)} KB)`)
  }
  const mime = detecteerMime(buffer)
  if (!mime || !AFBEELDING_MIMES.has(mime)) {
    throw new Error('Alleen afbeeldingen zijn toegestaan (JPEG, PNG, GIF, WebP, SVG, ICO)')
  }
}

/**
 * Valideer een geüpload document.
 * Gooit een Error als het bestand niet voldoet.
 */
export function valideerDocument(buffer, originalname, maxBytes = 100 * 1024 * 1024) {
  if (buffer.length > maxBytes) {
    throw new Error(`Bestand te groot (maximum ${Math.round(maxBytes / (1024 * 1024))} MB)`)
  }

  const ext = ('.' + originalname.split('.').pop()).toLowerCase()
  if (!DOCUMENT_EXTENSIES.has(ext)) {
    throw new Error(`Bestandstype niet toegestaan. Toegestaan: ${[...DOCUMENT_EXTENSIES].join(', ')}`)
  }

  const mime = detecteerMime(buffer)
  if (!mime || !DOCUMENT_MIMES.has(mime)) {
    throw new Error('Bestandsinhoud komt niet overeen met een toegestaan bestandstype')
  }
}
