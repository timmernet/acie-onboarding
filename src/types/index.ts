export type UserRole = 'reservist' | 'groepscommandant' | 'commandant' | 'beheerder'

export interface UserTask {
  taskId: string
  voltooid: boolean
  voltooiDatum?: string
  opmerking?: string
  nieuw?: boolean
}

export interface User {
  id: string
  naam: string
  email: string
  rol: UserRole
  pelotoonId: string
  pelotoonNaam: string
  groepId: string | null
  groepNaam: string | null
  aangemeldOp: string
  taken: UserTask[]
  actief: boolean
  laatstIngelogd?: string
}

export interface Peloton {
  id: string
  naam: string
}

export interface Groep {
  id: string
  naam: string
  pelotoonId: string
  pelotoonNaam?: string
}

export interface Taak {
  id: string
  titel: string
  beschrijving: string
  categorie: string
  contactId: string
  vereistTaakId?: string
}

export interface Bestand {
  id: string
  naam: string
  beschrijving: string
  categorie: string
  bestandsnaam: string
  bestandstype: string
  grootte: number
  geuploadOp: string
  geuploadDoor: string
  url: string
}

export interface Contact {
  id: string
  naam: string
  rang: string
  functie: string
  telefoon: string
  email: string
  tags: string[]
}

export interface AppConfig {
  appNaam: string
  eenheidNaam: string
  eenheidSubtitel: string
  logoUrl: string
  primairKleur: string
  emailHost: string
  emailPort: number
  emailSecure: boolean
  emailUser: string
  emailFrom: string
  emailAdmin: string
  naamReservist: string
  naamGroepscommandant: string
  naamCommandant: string
  naamPeloton: string
  naamGroep: string
  browserTitel: string
  faviconUrl: string
  emailType: string
  emailTenantId: string
  emailClientId: string
}
