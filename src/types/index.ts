export type UserRole = 'reservist' | 'commandant' | 'beheerder'

export interface UserTask {
  taskId: string
  voltooid: boolean
  voltooiDatum?: string
  opmerking?: string
}

export interface User {
  id: string
  naam: string
  email: string
  pin: string
  rol: UserRole
  pelotoon: string
  aangemeldOp: string
  taken: UserTask[]
}

export interface Taak {
  id: string
  titel: string
  beschrijving: string
  categorie: string
  contactId: string
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
