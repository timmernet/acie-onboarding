import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

const CONTACTEN_DATA = [
  { id: 'c1', naam: 'T. Smit', rang: '1Lt.', functie: 'Pelotonscommandant 1e Peloton', telefoon: '06-1234 5678', email: 't.smit@mindef.nl', tags: JSON.stringify(['Telefoon aanvragen', 'Algemeen', 'Planning', '1e Peloton']) },
  { id: 'c2', naam: 'M. de Vries', rang: 'Kpl.', functie: 'IT-beheerder', telefoon: '06-2345 6789', email: 'm.devries@mindef.nl', tags: JSON.stringify(['Telestick hardware aanvragen', 'Toegang tot intranet aanvragen', 'IT-ondersteuning']) },
  { id: 'c3', naam: 'A. Bakker', rang: 'Ltz.', functie: 'Medische Dienst', telefoon: '06-3456 7890', email: 'a.bakker@mindef.nl', tags: JSON.stringify(['Vaccinaties', 'Herhaling vaccinaties', 'Medische keuring', 'Gezondheid']) },
  { id: 'c4', naam: 'R. Jansen', rang: 'Sgt.maj.', functie: 'Personeelszaken (P&O)', telefoon: '06-4567 8901', email: 'r.jansen@mindef.nl', tags: JSON.stringify(['Defensiepas aanvragen', 'Administratie', 'Verlof', 'Salaris']) },
  { id: 'c5', naam: 'B. de Groot', rang: 'Kpt.', functie: 'Compagniescommandant A-Cie', telefoon: '06-5678 9012', email: 'b.degroot@mindef.nl', tags: JSON.stringify(['Algemeen', 'Escalatie', 'Compagnie']) },
  { id: 'c6', naam: 'K. Willems', rang: '1Lt.', functie: 'Pelotonscommandant 2e Peloton', telefoon: '06-6789 0123', email: 'k.willems@mindef.nl', tags: JSON.stringify(['Telefoon aanvragen', 'Algemeen', 'Planning', '2e Peloton']) },
  { id: 'c7', naam: 'J. van den Berg', rang: 'Sgt.', functie: 'Magazijnmeester', telefoon: '06-7890 1234', email: 'j.vandenberg@mindef.nl', tags: JSON.stringify(['Materieel', 'Uniform', 'Uitrusting', 'Telefoon aanvragen']) },
]

const TAKEN_DATA = [
  { id: 't1', titel: 'Defensiepas aanvragen', beschrijving: 'Vraag je Defensiepas aan bij P&O. Neem een geldig identiteitsbewijs (paspoort of ID-kaart) mee. De pas is verplicht voor toegang tot de kazerne.', categorie: 'Administratie', contactId: 'c4', volgorde: 0 },
  { id: 't2', titel: 'Telestick hardware aanvragen', beschrijving: 'Vraag de Telestick aan bij de IT-beheerder. Dit USB-apparaat is nodig voor toegang tot beveiligde Defensienetwerken vanuit huis of op locatie.', categorie: 'IT', contactId: 'c2', volgorde: 1 },
  { id: 't3', titel: 'Toegang tot intranet aanvragen', beschrijving: 'Vraag toegang aan tot het Defensie-intranet via de IT-helpdesk. Houd je personeelsnummer bij de hand. Verwerking duurt 1–3 werkdagen.', categorie: 'IT', contactId: 'c2', volgorde: 2 },
  { id: 't4', titel: 'Vaccinaties', beschrijving: 'Meld je aan bij de medische dienst voor de verplichte basisvaccinaties. Breng je vaccinatieboekje mee indien beschikbaar.', categorie: 'Medisch', contactId: 'c3', volgorde: 3 },
  { id: 't5', titel: 'Herhaling vaccinaties', beschrijving: 'Plan je herhalingsvaccinaties in. De medische dienst informeert je over het benodigde schema en de tijdstippen.', categorie: 'Medisch', contactId: 'c3', volgorde: 4 },
  { id: 't6', titel: 'Telefoon aanvragen', beschrijving: 'Vraag je diensttelefoon aan bij je pelotonscommandant of bij de uitgifte van het magazijn. Dit is je primaire communicatiemiddel tijdens dienst.', categorie: 'Materieel', contactId: 'c1', volgorde: 5 },
]

const DEMO_USERS = [
  {
    id: 'u1', naam: 'Admin Beheer', email: 'admin@mindef.nl', pin: '0000',
    rol: 'beheerder', pelotoon: 'Staf', aangemeldOp: '2024-01-01', actief: true,
    taakVoortgang: TAKEN_DATA.map(t => ({ taakId: t.id, voltooid: true, voltooiDatum: '2024-01-10' })),
  },
  {
    id: 'u2', naam: 'T. Smit', email: 't.smit@mindef.nl', pin: '1111',
    rol: 'commandant', pelotoon: '1e Peloton', aangemeldOp: '2024-01-01', actief: true,
    taakVoortgang: TAKEN_DATA.map(t => ({ taakId: t.id, voltooid: true, voltooiDatum: '2024-01-05' })),
  },
  {
    id: 'u3', naam: 'Lars Hendriksen', email: 'l.hendriksen@reservist.nl', pin: '2222',
    rol: 'reservist', pelotoon: '1e Peloton', aangemeldOp: '2024-03-01', actief: true,
    taakVoortgang: [
      { taakId: 't1', voltooid: true, voltooiDatum: '2024-03-05' },
      { taakId: 't2', voltooid: true, voltooiDatum: '2024-03-07' },
      { taakId: 't3', voltooid: false },
      { taakId: 't4', voltooid: false },
      { taakId: 't5', voltooid: false },
      { taakId: 't6', voltooid: true, voltooiDatum: '2024-03-03' },
    ],
  },
  {
    id: 'u4', naam: 'Sophie van Dam', email: 's.vandam@reservist.nl', pin: '3333',
    rol: 'reservist', pelotoon: '1e Peloton', aangemeldOp: '2024-03-05', actief: true,
    taakVoortgang: [
      { taakId: 't1', voltooid: true, voltooiDatum: '2024-03-08' },
      { taakId: 't2', voltooid: false },
      { taakId: 't3', voltooid: false },
      { taakId: 't4', voltooid: true, voltooiDatum: '2024-03-10' },
      { taakId: 't5', voltooid: false },
      { taakId: 't6', voltooid: false },
    ],
  },
  {
    id: 'u5', naam: 'Kevin Meijer', email: 'k.meijer@reservist.nl', pin: '4444',
    rol: 'reservist', pelotoon: '2e Peloton', aangemeldOp: '2024-03-10', actief: true,
    taakVoortgang: TAKEN_DATA.map(t => ({ taakId: t.id, voltooid: false })),
  },
  {
    id: 'u6', naam: 'Nathalie Oost', email: 'n.oost@reservist.nl', pin: '5555',
    rol: 'reservist', pelotoon: '2e Peloton', aangemeldOp: '2024-03-12', actief: true,
    taakVoortgang: TAKEN_DATA.map(t => ({ taakId: t.id, voltooid: true, voltooiDatum: '2024-03-20' })),
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Leeg de database
  await prisma.pinResetToken.deleteMany()
  await prisma.userTask.deleteMany()
  await prisma.user.deleteMany()
  await prisma.taak.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.bestand.deleteMany()

  // Contacten
  await prisma.contact.createMany({ data: CONTACTEN_DATA })
  console.log(`✓ ${CONTACTEN_DATA.length} contacten`)

  // Taken
  await prisma.taak.createMany({ data: TAKEN_DATA })
  console.log(`✓ ${TAKEN_DATA.length} taken`)

  // Gebruikers met gehashte PINs
  for (const u of DEMO_USERS) {
    const hashedPin = await bcrypt.hash(u.pin, 10)
    await prisma.user.create({
      data: {
        id: u.id,
        naam: u.naam,
        email: u.email,
        pin: hashedPin,
        rol: u.rol,
        pelotoon: u.pelotoon,
        aangemeldOp: u.aangemeldOp,
        actief: u.actief,
        taken: {
          create: u.taakVoortgang.map(t => ({
            taakId: t.taakId,
            voltooid: t.voltooid,
            voltooiDatum: t.voltooiDatum ?? null,
          })),
        },
      },
    })
  }
  console.log(`✓ ${DEMO_USERS.length} gebruikers (PINs gehasht)`)

  // Migreer bestaande bestanden uit server/bestanden.json (indien aanwezig)
  const bestandenFile = join(__dirname, '..', 'server', 'bestanden.json')
  if (existsSync(bestandenFile)) {
    const bestaande = JSON.parse(readFileSync(bestandenFile, 'utf-8'))
    if (bestaande.length > 0) {
      await prisma.bestand.createMany({ data: bestaande })
      console.log(`✓ ${bestaande.length} bestaande bestanden gemigreerd`)
    }
  }

  console.log('✅ Klaar!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
