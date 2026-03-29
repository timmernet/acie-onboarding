import nodemailer from 'nodemailer'
import { prisma } from './prisma.js'

async function getMailConfig() {
  let cfg = null
  try {
    cfg = await prisma.appConfig.findFirst({ where: { id: 1 } })
  } catch { /* DB not yet ready */ }

  return {
    host: cfg?.emailHost || process.env.EMAIL_HOST || '',
    port: cfg?.emailPort || Number(process.env.EMAIL_PORT) || 587,
    secure: cfg?.emailHost ? cfg.emailSecure : process.env.EMAIL_SECURE === 'true',
    user: cfg?.emailUser || process.env.EMAIL_USER || '',
    pass: cfg?.emailPass || process.env.EMAIL_PASS || '',
    from: cfg?.emailFrom || process.env.EMAIL_FROM || '',
    admin: cfg?.emailAdmin || process.env.EMAIL_ADMIN || '',
    appNaam: cfg?.appNaam || 'Reservisten Onboarding',
    eenheidNaam: cfg?.eenheidNaam || 'A-Compagnie · 30e Infanteriebataljon',
    eenheidSubtitel: cfg?.eenheidSubtitel || '13 Lichte Brigade — Reservisten Onboarding',
  }
}

function emailTemplate(titel, inhoud, appNaam, eenheidNaam, eenheidSubtitel) {
  return `
  <!DOCTYPE html>
  <html lang="nl">
  <head><meta charset="UTF-8"><style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 8px; max-width: 480px; margin: 0 auto; overflow: hidden; }
    .header { background: #1e4010; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 18px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #aed198; }
    .body { padding: 28px 24px; color: #333; font-size: 14px; line-height: 1.6; }
    .body h2 { color: #1e4010; margin-top: 0; }
    .footer { border-top: 1px solid #eee; padding: 16px 24px; font-size: 12px; color: #999; text-align: center; }
  </style></head>
  <body>
    <div class="card">
      <div class="header">
        <h1>${eenheidNaam}</h1>
        <p>${eenheidSubtitel}</p>
      </div>
      <div class="body">
        <h2>${titel}</h2>
        ${inhoud}
      </div>
      <div class="footer">Dit is een automatisch bericht. Reageer niet op deze e-mail.</div>
    </div>
  </body>
  </html>`
}

function buildTemplates(appNaam, eenheidNaam, eenheidSubtitel) {
  const tpl = (titel, inhoud) => emailTemplate(titel, inhoud, appNaam, eenheidNaam, eenheidSubtitel)
  return {
    registratie: ({ naam }) => ({
      onderwerp: 'Account aangevraagd — wacht op activatie',
      html: tpl('Account aangevraagd', `
        <p>Beste ${naam},</p>
        <p>Je account voor het ${appNaam} is aangemaakt en wacht op activatie door een commandant of beheerder.</p>
        <p>Je ontvangt een bevestigingsmail zodra je account is goedgekeurd.</p>
      `),
    }),
    registratie_admin: ({ naam, email, pelotoon }) => ({
      onderwerp: `Nieuw account aangevraagd — ${naam}`,
      html: tpl('Nieuw account ter activatie', `
        <p>Er heeft een nieuwe gebruiker een account aangevraagd:</p>
        <ul>
          <li><strong>Naam:</strong> ${naam}</li>
          <li><strong>E-mail:</strong> ${email}</li>
          <li><strong>Peloton:</strong> ${pelotoon}</li>
        </ul>
        <p>Log in op het portaal om het account te activeren of af te wijzen.</p>
      `),
    }),
    activatie: ({ naam }) => ({
      onderwerp: 'Je account is geactiveerd',
      html: tpl('Account geactiveerd', `
        <p>Beste ${naam},</p>
        <p>Goed nieuws — je account voor het ${appNaam} is geactiveerd. Je kunt nu inloggen.</p>
      `),
    }),
    'pin-reset': ({ naam, resetUrl }) => ({
      onderwerp: 'Pincode opnieuw instellen',
      html: tpl('Pincode opnieuw instellen', `
        <p>Beste ${naam},</p>
        <p>Er is een verzoek gedaan om je pincode opnieuw in te stellen. Klik op de knop hieronder om een nieuwe pincode te kiezen:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="background:#1e4010;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
            Nieuwe pincode instellen
          </a>
        </p>
        <p style="font-size:12px;color:#999">Of kopieer deze link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="font-size:12px;color:#999">Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, kun je deze e-mail negeren.</p>
      `),
    }),
  }
}

export async function verstuurEmail(type, naar, data = {}) {
  const cfg = await getMailConfig()

  if (!cfg.host) {
    console.log(`[Email gesimuleerd] type=${type} naar=${naar}`)
    return
  }

  const templates = buildTemplates(cfg.appNaam, cfg.eenheidNaam, cfg.eenheidSubtitel)
  const template = templates[type]
  if (!template) return
  const { onderwerp, html } = template({ ...data, naar })

  const transportConfig = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    tls: { rejectUnauthorized: false },
  }
  if (cfg.user && cfg.pass) transportConfig.auth = { user: cfg.user, pass: cfg.pass }

  try {
    const transporter = nodemailer.createTransport(transportConfig)
    await transporter.sendMail({
      from: cfg.from || cfg.user,
      to: naar,
      subject: onderwerp,
      html,
    })
  } catch (err) {
    console.error(`Email versturen mislukt (${type}):`, err.message)
  }
}
