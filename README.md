# Onboarding Portaal

Een volledig white-label onboarding portaal voor organisaties met hiërarchische teams. Ontworpen voor reservisten-eenheden maar breed inzetbaar. Beheerders kunnen namen van rollen, eenheden, kleuren, logo en favicon volledig aanpassen via de beheerdersinterface.

---

## Inhoudsopgave

1. [Snel starten](#snel-starten)
2. [Demo accounts](#demo-accounts)
3. [Architectuur](#architectuur)
4. [Functionaliteit](#functionaliteit)
5. [Rollen & toegang](#rollen--toegang)
6. [Organisatiestructuur](#organisatiestructuur)
7. [White-labeling & thema](#white-labeling--thema)
8. [E-mailconfiguratie](#e-mailconfiguratie)
9. [Beveiliging](#beveiliging)
10. [Productie-deployment](#productie-deployment)
11. [Database & backup](#database--backup)
12. [Projectstructuur](#projectstructuur)
13. [Omgevingsvariabelen](#omgevingsvariabelen)

---

## Snel starten

### Vereisten

- Node.js 18 of hoger
- npm 9 of hoger

### Installatie

```bash
git clone <repository-url>
cd onboarding-portaal
npm install
```

### Database initialiseren

```bash
npm run db:push     # Schema toepassen op SQLite
npm run db:seed     # Demodata laden (demo accounts, voorbeeldtaken)
```

### Ontwikkeling starten

```bash
npm run dev
```

Dit start tegelijkertijd:
- **Frontend** (Vite) op `http://localhost:5173`
- **Backend** (Express) op `http://localhost:3001`

Vite proxyt automatisch alle `/api/` en `/uploads/` requests naar de backend.

### Overige commando's

| Commando | Omschrijving |
|---|---|
| `npm run dev` | Frontend + backend starten |
| `npm run dev:client` | Alleen Vite frontend |
| `npm run dev:server` | Alleen Express backend |
| `npm run build` | TypeScript check + productiebuild |
| `npm run preview` | Productiebuild lokaal bekijken |
| `npm run db:push` | Prisma schema toepassen (zonder data reset) |
| `npm run db:seed` | Database vullen met demodata |

---

## Demo accounts

Na `npm run db:seed` zijn de volgende accounts beschikbaar:

| E-mail | PIN | Rol |
|---|---|---|
| `admin@mindef.nl` | `0000` | Beheerder |
| `t.smit@mindef.nl` | `1111` | Commandant (Pelotonscommandant) |
| `p.deboer@mindef.nl` | `6666` | Groepscommandant |
| `l.hendriksen@reservist.nl` | `2222` | Reservist |

> **Let op:** Verwijder of wijzig de demoaccounts en standaard-PINs vóór productie-gebruik.

---

## Architectuur

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 18 + TypeScript + Vite + Tailwind CSS)  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / API calls
┌────────────────────────▼────────────────────────────────┐
│  Express.js (Node 18)                                   │
│  ├── JWT authenticatie (httpOnly cookies, 8 uur)        │
│  ├── Role-based access control                          │
│  ├── Rate limiting (express-rate-limit)                 │
│  ├── Security headers (helmet)                          │
│  └── Bestandsopslag (server/uploads/)                   │
└────────────────────────┬────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────┐
│  SQLite (server/data.db)                                │
│  ├── Users, Pelotonen, Groepen                          │
│  ├── Taken, UserTasks                                   │
│  ├── Contacten, Bestanden                               │
│  └── AppConfig (singleton, white-label instellingen)    │
└─────────────────────────────────────────────────────────┘
```

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS met militair kleurenpalet (`army-*`, `gold-*`). Alle state via React Context (`AuthContext`). Communicatie uitsluitend via REST API calls — geen localStorage voor gevoelige data.

**Backend** — Express.js met modulaire routes per domein. JWT in httpOnly cookies voorkomt XSS-aanvallen op tokens. Bcrypt voor PIN-hashing.

**Database** — SQLite via Prisma ORM. Geschikt voor deployments met één server-instantie. Alle applicatiedata (inclusief configuratie, gebruikers en taken) staat in `server/data.db`.

---

## Functionaliteit

### Taken (onboarding checklist)
- Elke gebruiker heeft een persoonlijke taakenlijst met voortgangsindicator
- Taken kunnen een vereiste hebben — pas beschikbaar nadat een andere taak is afgerond
- Geblokkeerde taken zijn zichtbaar maar niet voltooibaar (slotpictogram)
- Per taak kan de gebruiker een persoonlijke opmerking toevoegen
- Beheerders beheren de taakenlijst: toevoegen, bewerken, volgorde aanpassen, verwijderen
- Nieuwe taken worden gemarkeerd met "Nieuw" badge bij de gebruiker

### Gebruikersbeheer
- Zelfregistratie via `/registreer` met peloton/groep-koppeling
- Nieuwe accounts wachten op activatie door commandant of beheerder
- Beheerders en commandanten kunnen gebruikers direct aanmaken, bewerken en activeren
- PIN-reset via e-maillink (tijdgebonden token, 24 uur geldig)
- Accountvergrendeling na 5 mislukte inlogpogingen (15 minuten)

### Documenten
- Procedures, handboeken en instructies per categorie
- Bestanden opgeslagen op server (`server/uploads/`), metadata in database
- Klik om document direct te openen in browser
- Commandanten en beheerders uploaden/verwijderen bestanden (max. 100 MB)

### Contacten
- Doorzoekbaar adresboek met rang, functie, telefoon en e-mail
- Beheerders beheren contacten

### Eenhedenbeheer (Beheerder)
- Afdelingen (pelotonen) aanmaken, hernoemen en verwijderen
- Groepen per afdeling aanmaken, hernoemen en verwijderen
- Gebruikers worden gekoppeld aan afdeling + groep bij registratie of via beheerdersbeheer

---

## Rollen & toegang

| Functie | Reservist | Groepscommandant | Commandant | Beheerder |
|---|:---:|:---:|:---:|:---:|
| Eigen taken bijhouden | ✓ | ✓ | ✓ | ✓ |
| Voortgang eigen groep zien | — | ✓ | ✓ | ✓ |
| Voortgang eigen afdeling zien | — | — | ✓ | ✓ |
| Gebruikers in eigen groep beheren | — | ✓ | — | — |
| Gebruikers in eigen afdeling beheren | — | — | ✓ | — |
| Alle gebruikers beheren | — | — | — | ✓ |
| Taken beheren | — | — | — | ✓ |
| Contacten beheren | — | — | — | ✓ |
| Documenten uploaden | — | — | ✓ | ✓ |
| Eenheden beheren | — | — | — | ✓ |
| App-configuratie & thema | — | — | — | ✓ |
| E-mailconfiguratie | — | — | — | ✓ |

> De weergavenamen van alle rollen zijn volledig aanpasbaar via het Thema-paneel.

### Scopebeperking
- Een **groepscommandant** ziet en beheert uitsluitend gebruikers van zijn eigen groep
- Een **commandant** ziet en beheert uitsluitend gebruikers van zijn eigen afdeling
- Scope wordt afgedwongen op de server (JWT-claims + databasequery) — niet alleen in de UI

---

## Organisatiestructuur

```
Afdeling (Peloton)
└── Groep
    └── Gebruiker (Reservist)
```

Elke gebruiker is gekoppeld aan een **afdeling** (verplicht) en optioneel aan een **groep** binnen die afdeling. Beheerders passen de namen van beide niveaus aan via het Thema-paneel (bijv. "Afdeling" → "Compagnie", "Groep" → "Sectie").

---

## White-labeling & thema

Via **Beheerder → Thema** zijn de volgende aspecten aanpasbaar:

### Tekst & naam
| Veld | Beschrijving |
|---|---|
| Naam applicatie | Weergegeven in e-mails en interface |
| Naam eenheid | Grote header in e-mailsjablonen |
| Subtitel eenheid | Kleine tekst onder de naam |
| Browsertitelbalk | Tekst zichtbaar in het browsertabblad |

### Naamgeving rollen & eenheden
Alle interne rollen en eenheden krijgen een organisatie-specifieke naam:

| Intern | Standaard | Aanpasbaar naar |
|---|---|---|
| `reservist` | Reservist | Medewerker, Cursist, … |
| `groepscommandant` | Groepscommandant | Groepsleider, Teamleider, … |
| `commandant` | Pelotonscommandant | Manager, Afdelingshoofd, … |
| `peloton` | Peloton | Afdeling, Compagnie, Team, … |
| `groep` | Groep | Sectie, Team, Squad, … |

### Kleur
Eén primaire kleur bepaalt het gehele kleurschema (10 tinten gegenereerd via HSL).

### Logo & favicon
- **Logo**: getoond in de header en e-mails. Aanbevolen: PNG of SVG met transparante achtergrond, max. 2 MB.
- **Favicon**: het icoon in het browsertabblad. Aanbevolen: PNG of ICO, 32×32 px, max. 512 KB.

Alle wijzigingen worden direct actief zonder herstart.

---

## E-mailconfiguratie

Via **Beheerder → E-mail** wordt de e-mailserver geconfigureerd. E-mails worden verstuurd voor:
- Activatiemelding (beheerder ontvangt bericht bij nieuwe registratie)
- PIN-reset link (gebruiker ontvangt tijdgebonden resetlink)

### Optie 1 — Standaard SMTP

Geschikt voor elke SMTP-server (Gmail, Mailgun, eigen mailserver, etc.).

| Veld | Voorbeeld |
|---|---|
| SMTP-server | `smtp.gmail.com` |
| Poort | `587` (STARTTLS) of `465` (SSL) |
| SSL/TLS | Aan bij poort 465 |
| Gebruikersnaam | `noreply@jouwdomein.nl` |
| Wachtwoord | App-wachtwoord of SMTP-wachtwoord |

### Optie 2 — Exchange Online (Microsoft 365)

Gebruikt **OAuth2 client credentials** — geen basic auth, geen app-wachtwoord vereist.

#### Stap 1 — Azure app-registratie aanmaken

1. Ga naar [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App-registraties**
2. Klik **Nieuwe registratie**
3. Geef de app een naam (bijv. "Onboarding Portaal E-mail")
4. Kies **Accounts in deze organisatiedirectory alleen**
5. Klik **Registreren**
6. Noteer de **Tenant ID** (map-/tenantid) en **Application (client) ID** — beide zijn GUIDs

#### Stap 2 — API-permissie toevoegen

1. Ga naar **API-machtigingen** → **Een machtiging toevoegen**
2. Kies **Microsoft Graph** → **Toepassingsmachtigingen**
3. Zoek op `Mail` en selecteer **Mail.Send**
4. Klik **Beheerder toestemming verlenen voor [jouw tenant]** — dit vereist een Global Administrator

#### Stap 3 — Client secret aanmaken

1. Ga naar **Certificaten en geheimen** → **Nieuw clientgeheim**
2. Geef een beschrijving en vervaldatum op
3. Klik **Toevoegen** en **kopieer de waarde direct** — deze is later niet meer zichtbaar

#### Stap 4 — SMTP AUTH inschakelen voor het postvak

1. Ga naar het **Exchange Admin Center** → **Postvakken**
2. Selecteer het verzendende postvak (bijv. `noreply@jouwdomein.nl`)
3. Ga naar **E-mailapps beheren** → schakel **Geverifieerde SMTP** in
4. Sla op

#### Stap 5 — Configureren in de app

Vul in **Beheerder → E-mail → Exchange Online (Microsoft 365)**:

| Veld | Waarde |
|---|---|
| Tenant ID | GUID van stap 1 |
| Client ID | GUID van stap 1 |
| Client Secret | Waarde van stap 3 |
| Verzendend e-mailadres | bijv. `noreply@jouwdomein.nl` |

Klik **Instellingen opslaan** en daarna **Test** om een test-e-mail naar je eigen account te sturen.

> **Veiligheid:** Client Secret en SMTP-wachtwoord worden gehasht opgeslagen en nooit teruggestuurd naar de browser. Vervang het secret tijdig vóór de vervaldatum.

---

## Beveiliging

### Ingebouwde beveiligingsmaatregelen

| Maatregel | Details |
|---|---|
| **JWT in httpOnly cookies** | Tokens niet toegankelijk via JavaScript — beschermt tegen XSS |
| **Bcrypt PIN-hashing** | PINs worden nooit in plaintext opgeslagen (cost factor 10) |
| **Security headers** | Helmet.js: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Rate limiting** | Algemeen: 300 req/15 min; Login: 20 req/15 min; PIN-reset: 10 req/uur (per IP) |
| **Accountvergrendeling** | Na 5 mislukte inlogpogingen: account geblokkeerd voor 15 minuten |
| **Scope-afdwinging** | Alle schrijfoperaties gecontroleerd op server (niet alleen UI) |
| **Gevoelige velden** | Wachtwoorden en secrets worden gefilterd uit API-responses |
| **CORS** | Alleen geconfigureerde origins toegestaan |

### Aanbevelingen voor productie

- Draai de app achter een **reverse proxy** (Nginx of Caddy) met HTTPS/TLS
- Stel `APP_URL` in op het publieke domein
- Gebruik een **sterk willekeurig JWT_SECRET** (minimaal 32 tekens)
- Verwijder of deactiveer de demoaccount-PINs na eerste inlog
- Schakel HTTPS in en zorg voor automatische certificaatvernieuwing (Let's Encrypt)

---

## Productie-deployment

### Builden

```bash
npm run build
```

Dit genereert een geoptimaliseerde frontend in `dist/`. De Express backend serveert deze bestanden statisch.

### Draaien

```bash
node server/index.js
```

Of met PM2 voor automatisch herstarten bij crashes:

```bash
npm install -g pm2
pm2 start server/index.js --name onboarding
pm2 save
pm2 startup   # Automatisch starten bij systeem-herstart
```

### Nginx reverse proxy (voorbeeld)

```nginx
server {
    listen 443 ssl;
    server_name onboarding.jouwdomein.nl;

    ssl_certificate     /etc/letsencrypt/live/onboarding.jouwdomein.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/onboarding.jouwdomein.nl/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Database & backup

De applicatie gebruikt **SQLite** via Prisma ORM. De database staat in `server/data.db`.

### Backup maken

```bash
# Kopieer het databasebestand (safe terwijl server draait dankzij WAL-mode)
cp server/data.db backup/data-$(date +%Y%m%d-%H%M%S).db
```

### Restore uitvoeren

```bash
# Stop de server
pm2 stop onboarding

# Vervang de database
cp backup/data-20250101-120000.db server/data.db

# Herstart de server
pm2 start onboarding
```

### Automatische dagelijkse backup (cron)

```bash
# Voeg toe aan crontab (crontab -e):
0 3 * * * cp /pad/naar/server/data.db /pad/naar/backups/data-$(date +\%Y\%m\%d).db
# Bestanden ouder dan 30 dagen verwijderen:
0 4 * * * find /pad/naar/backups/ -name "data-*.db" -mtime +30 -delete
```

### Schema-updates

Bij aanpassingen aan `prisma/schema.prisma` in productie:

```bash
npm run db:push   # Past het schema toe zonder data te verwijderen
```

> Maak altijd een backup vóór het uitvoeren van schema-updates.

---

## Projectstructuur

```
├── src/                        # Frontend (React + TypeScript)
│   ├── App.tsx                 # Routing + dynamische titel/favicon
│   ├── components/
│   │   ├── Layout.tsx          # Navigatie, header, rol-indicator
│   │   ├── UserBeheerPanel.tsx # Gebruikersbeheer voor admins/commandanten
│   │   ├── EenhedenPanel.tsx   # Afdeling/groep-beheer
│   │   ├── ThemaPanel.tsx      # White-label instellingen
│   │   └── EmailConfigPanel.tsx
│   ├── context/
│   │   └── AuthContext.tsx     # Centrale state, API-calls, auth-logica
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ReservistDashboard.tsx
│   │   ├── CommanderDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── types/index.ts          # TypeScript interfaces
│
├── server/                     # Backend (Express + Prisma)
│   ├── index.js                # Express app, middleware, routing
│   ├── email.js                # E-mailverzending (SMTP + Exchange OAuth2)
│   ├── prisma.js               # Prisma client singleton
│   ├── middleware/
│   │   └── auth.js             # JWT-verificatie, rol-checks
│   ├── routes/
│   │   ├── auth.js             # Login, registratie, PIN-reset
│   │   ├── users.js            # Gebruikersbeheer (scope-aware)
│   │   ├── pelotonen.js        # Afdeling-CRUD
│   │   ├── groepen.js          # Groep-CRUD
│   │   ├── taken.js            # Taakbeheer
│   │   ├── contacten.js        # Contactbeheer
│   │   ├── bestanden.js        # Bestandsupload/-download
│   │   └── config.js           # App-configuratie (thema, e-mail)
│   └── uploads/                # Geüploade bestanden (niet in git)
│
├── prisma/
│   ├── schema.prisma           # Databaseschema
│   └── seed.js                 # Demodata
│
└── server/data.db              # SQLite database (niet in git)
```

---

## Omgevingsvariabelen

Maak een `.env` bestand aan in de root van het project:

```env
# Verplicht in productie
JWT_SECRET=vervang-dit-door-een-lang-willekeurig-geheim-minimaal-32-tekens

# Poort van de Express backend (standaard: 3001)
PORT=3001

# Publiek domein voor CORS (standaard: http://localhost:5173)
APP_URL=https://onboarding.jouwdomein.nl

# Database (standaard: ./server/data.db)
DATABASE_URL=file:./data.db

# Optioneel: fallback e-mailinstellingen (kunnen ook via admin-panel worden ingesteld)
EMAIL_HOST=smtp.jouwdomein.nl
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@jouwdomein.nl
EMAIL_PASS=jouw-wachtwoord
EMAIL_FROM=Onboarding Portaal <noreply@jouwdomein.nl>
EMAIL_ADMIN=beheerder@jouwdomein.nl
```

> Commit `.env` **nooit** naar versiebeheer. Het staat standaard in `.gitignore`.
