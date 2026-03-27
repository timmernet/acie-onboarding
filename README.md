# Onboarding — A-Compagnie 30IBB

Resume coding session:
claude --resume ba594483-6d60-4988-9d94-da1055aa15b5

Reservisten onboarding portaal voor A-Compagnie, 30e Infanteriebataljon · 13 Lichte Brigade.

## Starten

```bash
npm install
npm run dev
```

Dit start zowel de Vite frontend (standaard op `http://localhost:5173`) als de Express API-server (op `http://localhost:3001`) tegelijkertijd.

## Overige commando's

| Commando | Omschrijving |
|---|---|
| `npm run dev` | Frontend + backend starten |
| `npm run dev:client` | Alleen Vite frontend |
| `npm run dev:server` | Alleen Express backend |
| `npm run build` | TypeScript check + productie build |
| `npm run preview` | Productie build lokaal bekijken |

## Demo accounts

| E-mail | PIN | Rol |
|---|---|---|
| admin@mindef.nl | 0000 | Beheerder |
| t.smit@mindef.nl | 1111 | Commandant |
| l.hendriksen@reservist.nl | 2222 | Reservist |

## Functionaliteit

### Rollen
- **Reservist** — volgt persoonlijke onboarding taken bij
- **Commandant** — bekijkt voortgang van alle reservisten per peloton
- **Beheerder** — beheert gebruikers, taken, contacten en documenten

### Taken
- Reservisten werken een persoonlijke taakenlijst af met voortgangsindicator
- Taken kunnen een vereiste hebben (een andere taak die eerst afgerond moet zijn)
- Geblokkeerde taken zijn zichtbaar maar niet voltooibaar
- Per taak kan een persoonlijke opmerking worden toegevoegd
- Beheerders kunnen taken toevoegen, bewerken, verwijderen en de volgorde aanpassen

### Documenten
- Procedures, handboeken en instructies per categorie
- Bestanden worden opgeslagen op de server (`server/uploads/`)
- Klik op een document om het direct te openen in de browser
- Commandanten en beheerders kunnen bestanden uploaden (max. 100 MB) en verwijderen

### Contacten
- Doorzoekbaar adresboek met rang, functie, telefoon en e-mail
- Beheerders kunnen contacten toevoegen, bewerken en verwijderen

### Auditing (eerste stap)
- Laatste inlogdatum wordt bijgehouden per gebruiker
- Zichtbaar voor commandanten en beheerders in het voortgangsoverzicht

## Architectuur

**Frontend** — React 18 + TypeScript + Vite + Tailwind CSS
Alle gebruikers- en taakinformatie wordt opgeslagen in `localStorage` via React Context.

**Backend** — Express (Node.js)
Alleen gebruikt voor bestandsopslag. Bestanden staan in `server/uploads/`, metadata in `server/bestanden.json`. In development proxyt Vite de `/api/` en `/uploads/` requests naar de Express server op poort 3001.

## Projectstructuur

```
src/
├── components/       # Layout, ProtectedRoute, PinInput
├── context/          # AuthContext — centrale state (gebruikers, taken, contacten)
├── data/             # Seed data (demo gebruikers, taken, contacten)
├── pages/            # Een pagina per route
└── types/            # TypeScript interfaces

server/
├── index.js          # Express API voor bestandsopslag
└── uploads/          # Geüploade bestanden (niet in git)
```
