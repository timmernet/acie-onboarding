import nodemailer from 'nodemailer'
import { prisma } from './prisma.js'

async function getMailConfig() {
  let cfg = null
  try {
    cfg = await prisma.appConfig.findFirst({ where: { id: 1 } })
  } catch { /* DB not yet ready */ }

  return {
    emailType: cfg?.emailType || 'smtp',
    host: cfg?.emailHost || process.env.EMAIL_HOST || '',
    port: cfg?.emailPort || Number(process.env.EMAIL_PORT) || 587,
    secure: cfg?.emailHost ? cfg.emailSecure : process.env.EMAIL_SECURE === 'true',
    user: cfg?.emailUser || process.env.EMAIL_USER || '',
    pass: cfg?.emailPass || process.env.EMAIL_PASS || '',
    from: cfg?.emailFrom || process.env.EMAIL_FROM || '',
    admin: cfg?.emailAdmin || process.env.EMAIL_ADMIN || '',
    tenantId: cfg?.emailTenantId || '',
    clientId: cfg?.emailClientId || '',
    clientSecret: cfg?.emailClientSecret || '',
    appNaam: cfg?.appNaam || 'Reservisten Onboarding',
    eenheidNaam: cfg?.eenheidNaam || 'A-Compagnie · 30e Infanteriebataljon',
    eenheidSubtitel: cfg?.eenheidSubtitel || '13 Lichte Brigade — Reservisten Onboarding',
  }
}

async function getGraphToken(tenantId, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  })
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Graph API token ophalen mislukt')
  return data.access_token
}

async function sendViaGraph({ tenantId, clientId, clientSecret, user, from, to, subject, html }) {
  const accessToken = await getGraphToken(tenantId, clientId, clientSecret)
  const sender = from || user
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: to } }],
          from: { emailAddress: { address: sender } },
        },
        saveToSentItems: false,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Graph sendMail mislukt (HTTP ${res.status})`)
  }
}

export async function createTransporter(cfg) {
  const transportConfig = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    tls: { rejectUnauthorized: false },
  }
  if (cfg.user && cfg.pass) transportConfig.auth = { user: cfg.user, pass: cfg.pass }
  return nodemailer.createTransport(transportConfig)
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

export async function verstuurTestEmail(cfg, naar) {
  const isExchange = cfg.emailType === 'exchange' && cfg.tenantId && cfg.clientId && cfg.clientSecret
  if (isExchange) {
    await sendViaGraph({
      tenantId: cfg.tenantId,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      user: cfg.user,
      from: cfg.from || cfg.user,
      to: naar,
      subject: 'Test e-mail — Onboarding Portaal',
      html: '<p>De e-mailconfiguratie werkt correct.</p>',
    })
  } else {
    const transporter = await createTransporter(cfg)
    await transporter.sendMail({
      from: cfg.from || cfg.user,
      to: naar,
      subject: 'Test e-mail — Onboarding Portaal',
      text: 'De e-mailconfiguratie werkt correct.',
    })
  }
}

export async function verstuurEmail(type, naar, data = {}) {
  const cfg = await getMailConfig()
  const isExchange = cfg.emailType === 'exchange' && cfg.tenantId && cfg.clientId && cfg.clientSecret

  if (!isExchange && !cfg.host) {
    console.log(`[Email gesimuleerd] type=${type} naar=${naar}`)
    return
  }

  const templates = buildTemplates(cfg.appNaam, cfg.eenheidNaam, cfg.eenheidSubtitel)
  const template = templates[type]
  if (!template) return
  const { onderwerp, html } = template({ ...data, naar })

  try {
    if (isExchange) {
      await sendViaGraph({
        tenantId: cfg.tenantId,
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        user: cfg.user,
        from: cfg.from || cfg.user,
        to: naar,
        subject: onderwerp,
        html,
      })
    } else {
      const transporter = await createTransporter(cfg)
      await transporter.sendMail({
        from: cfg.from || cfg.user,
        to: naar,
        subject: onderwerp,
        html,
      })
    }
  } catch (err) {
    console.error(`Email versturen mislukt (${type}):`, err.message)
  }
}
