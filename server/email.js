import nodemailer from 'nodemailer'

export const emailGeconfigureerd = !!process.env.EMAIL_HOST

const transporterConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  tls: { rejectUnauthorized: false },
}
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporterConfig.auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
}

const transporter = emailGeconfigureerd ? nodemailer.createTransport(transporterConfig) : null

if (!emailGeconfigureerd) {
  console.warn('⚠️  Email niet geconfigureerd. Stel EMAIL_HOST in via .env')
}

function emailTemplate(titel, inhoud) {
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
        <h1>A-Compagnie · 30e Infanteriebataljon</h1>
        <p>13 Lichte Brigade — Reservisten Onboarding</p>
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

const TEMPLATES = {
  registratie: ({ naam }) => ({
    onderwerp: 'Account aangevraagd — wacht op activatie',
    html: emailTemplate('Account aangevraagd', `
      <p>Beste ${naam},</p>
      <p>Je account voor het Reservisten Onboarding Portaal is aangemaakt en wacht op activatie door een commandant of beheerder.</p>
      <p>Je ontvangt een bevestigingsmail zodra je account is goedgekeurd.</p>
    `),
  }),
  registratie_admin: ({ naam, email, pelotoon }) => ({
    onderwerp: `Nieuw account aangevraagd — ${naam}`,
    html: emailTemplate('Nieuw account ter activatie', `
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
    html: emailTemplate('Account geactiveerd', `
      <p>Beste ${naam},</p>
      <p>Goed nieuws — je account voor het Reservisten Onboarding Portaal is geactiveerd. Je kunt nu inloggen.</p>
    `),
  }),
  'pin-reset': ({ naam, resetUrl }) => ({
    onderwerp: 'Pincode opnieuw instellen',
    html: emailTemplate('Pincode opnieuw instellen', `
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

export async function verstuurEmail(type, naar, data = {}) {
  if (!emailGeconfigureerd) {
    console.log(`[Email gesimuleerd] type=${type} naar=${naar}`)
    return
  }
  const template = TEMPLATES[type]
  if (!template) return
  const { onderwerp, html } = template({ ...data, naar })
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: naar,
      subject: onderwerp,
      html,
    })
  } catch (err) {
    console.error(`Email versturen mislukt (${type}):`, err.message)
  }
}
