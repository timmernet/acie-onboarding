import type { Taak, Contact } from '../types'

export const TAKEN: Taak[] = [
  {
    id: 't1',
    titel: 'Defensiepas aanvragen',
    beschrijving: 'Vraag je Defensiepas aan bij P&O. Neem een geldig identiteitsbewijs (paspoort of ID-kaart) mee. De pas is verplicht voor toegang tot de kazerne.',
    categorie: 'Administratie',
    contactId: 'c4',
  },
  {
    id: 't2',
    titel: 'Telestick hardware aanvragen',
    beschrijving: 'Vraag de Telestick aan bij de IT-beheerder. Dit USB-apparaat is nodig voor toegang tot beveiligde Defensienetwerken vanuit huis of op locatie.',
    categorie: 'IT',
    contactId: 'c2',
  },
  {
    id: 't3',
    titel: 'Toegang tot intranet aanvragen',
    beschrijving: 'Vraag toegang aan tot het Defensie-intranet via de IT-helpdesk. Houd je personeelsnummer bij de hand. Verwerking duurt 1–3 werkdagen.',
    categorie: 'IT',
    contactId: 'c2',
  },
  {
    id: 't4',
    titel: 'Vaccinaties',
    beschrijving: 'Meld je aan bij de medische dienst voor de verplichte basisvaccinaties. Breng je vaccinatieboekje mee indien beschikbaar.',
    categorie: 'Medisch',
    contactId: 'c3',
  },
  {
    id: 't5',
    titel: 'Herhaling vaccinaties',
    beschrijving: 'Plan je herhalingsvaccinaties in. De medische dienst informeert je over het benodigde schema en de tijdstippen.',
    categorie: 'Medisch',
    contactId: 'c3',
  },
  {
    id: 't6',
    titel: 'Telefoon aanvragen',
    beschrijving: 'Vraag je diensttelefoon aan bij je pelotonscommandant of bij de uitgifte van het magazijn. Dit is je primaire communicatiemiddel tijdens dienst.',
    categorie: 'Materieel',
    contactId: 'c1',
  },
]

export const CONTACTEN: Contact[] = [
  {
    id: 'c1',
    naam: 'T. Smit',
    rang: '1Lt.',
    functie: 'Pelotonscommandant 1e Peloton',
    telefoon: '06-1234 5678',
    email: 't.smit@mindef.nl',
    tags: ['Telefoon aanvragen', 'Algemeen', 'Planning', '1e Peloton'],
  },
  {
    id: 'c2',
    naam: 'M. de Vries',
    rang: 'Kpl.',
    functie: 'IT-beheerder',
    telefoon: '06-2345 6789',
    email: 'm.devries@mindef.nl',
    tags: ['Telestick hardware aanvragen', 'Toegang tot intranet aanvragen', 'IT-ondersteuning'],
  },
  {
    id: 'c3',
    naam: 'A. Bakker',
    rang: 'Ltz.',
    functie: 'Medische Dienst',
    telefoon: '06-3456 7890',
    email: 'a.bakker@mindef.nl',
    tags: ['Vaccinaties', 'Herhaling vaccinaties', 'Medische keuring', 'Gezondheid'],
  },
  {
    id: 'c4',
    naam: 'R. Jansen',
    rang: 'Sgt.maj.',
    functie: 'Personeelszaken (P&O)',
    telefoon: '06-4567 8901',
    email: 'r.jansen@mindef.nl',
    tags: ['Defensiepas aanvragen', 'Administratie', 'Verlof', 'Salaris'],
  },
  {
    id: 'c5',
    naam: 'B. de Groot',
    rang: 'Kpt.',
    functie: 'Compagniescommandant A-Cie',
    telefoon: '06-5678 9012',
    email: 'b.degroot@mindef.nl',
    tags: ['Algemeen', 'Escalatie', 'Compagnie'],
  },
  {
    id: 'c6',
    naam: 'K. Willems',
    rang: '1Lt.',
    functie: 'Pelotonscommandant 2e Peloton',
    telefoon: '06-6789 0123',
    email: 'k.willems@mindef.nl',
    tags: ['Telefoon aanvragen', 'Algemeen', 'Planning', '2e Peloton'],
  },
  {
    id: 'c7',
    naam: 'J. van den Berg',
    rang: 'Sgt.',
    functie: 'Magazijnmeester',
    telefoon: '06-7890 1234',
    email: 'j.vandenberg@mindef.nl',
    tags: ['Materieel', 'Uniform', 'Uitrusting', 'Telefoon aanvragen'],
  },
]

export const PELOTONEN = ['1e Peloton', '2e Peloton', '3e Peloton', 'Staf']

