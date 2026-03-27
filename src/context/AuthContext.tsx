import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, UserRole, Taak, Contact, Bestand } from '../types'
import { DEMO_USERS, TAKEN as INIT_TAKEN, CONTACTEN as INIT_CONTACTEN } from '../data/dummyData'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  taken: Taak[]
  contacten: Contact[]
  login: (email: string, pin: string) => 'ok' | 'fout' | 'wacht'
  activeerUser: (userId: string) => void
  deactiveerUser: (userId: string) => void
  afwijsUser: (userId: string) => void
  addUserDirect: (data: Omit<User, 'id' | 'taken' | 'aangemeldOp' | 'laatstIngelogd'>) => { ok: boolean; error?: string }
  updateUser: (data: Pick<User, 'id' | 'naam' | 'email' | 'pin' | 'pelotoon' | 'rol'>) => { ok: boolean; error?: string }
  deleteUser: (userId: string) => void
  setPinByEmail: (email: string, pin: string) => boolean
  register: (naam: string, email: string, pin: string, pelotoon: string) => { ok: boolean; error?: string }
  logout: () => void
  updateUserRole: (userId: string, rol: UserRole) => void
  toggleTask: (taskId: string) => void
  setOpmerking: (taskId: string, opmerking: string) => void
  moveTaakOmhoog: (id: string) => void
  moveTaakOmlaag: (id: string) => void
  addTaak: (taak: Omit<Taak, 'id'>) => void
  updateTaak: (taak: Taak) => void
  deleteTaak: (id: string) => void
  addContact: (contact: Omit<Contact, 'id'>) => void
  updateContact: (contact: Contact) => void
  deleteContact: (id: string) => void
  bestanden: Bestand[]
  uploadBestand: (file: File, naam: string, beschrijving: string, categorie: string) => Promise<void>
  deleteBestand: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function verstuurEmail(type: string, naar: string, data: Record<string, string> = {}) {
  try {
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, naar, ...data }),
    })
  } catch {
    // email-fouten zijn niet blokkerend
  }
}

const STORAGE_KEY = 'acie_users_v1'
const SESSION_KEY = 'acie_session_v1'
const TAKEN_KEY = 'acie_taken_v1'
const CONTACTEN_KEY = 'acie_contacten_v1'

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEMO_USERS
    const parsed: User[] = JSON.parse(raw)
    // Migratie: bestaande gebruikers zonder 'actief' veld krijgen actief: true
    return parsed.map(u => u.actief === undefined ? { ...u, actief: true } : u)
  } catch {
    return DEMO_USERS
  }
}

function loadTaken(): Taak[] {
  try {
    const raw = localStorage.getItem(TAKEN_KEY)
    return raw ? JSON.parse(raw) : INIT_TAKEN
  } catch {
    return INIT_TAKEN
  }
}

function loadContacten(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTEN_KEY)
    return raw ? JSON.parse(raw) : INIT_CONTACTEN
  } catch {
    return INIT_CONTACTEN
  }
}


function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers)
  const [taken, setTaken] = useState<Taak[]>(loadTaken)
  const [contacten, setContacten] = useState<Contact[]>(loadContacten)
  const [bestanden, setBestanden] = useState<Bestand[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const sessionId = sessionStorage.getItem(SESSION_KEY)
    if (!sessionId) return null
    const allUsers = loadUsers()
    return allUsers.find(u => u.id === sessionId) ?? null
  })

  useEffect(() => {
    saveUsers(users)
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id)
      if (updated) setCurrentUser(updated)
    }
  }, [users]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(TAKEN_KEY, JSON.stringify(taken))
  }, [taken])

  useEffect(() => {
    localStorage.setItem(CONTACTEN_KEY, JSON.stringify(contacten))
  }, [contacten])

  useEffect(() => {
    fetch('/api/bestanden')
      .then(r => r.json())
      .then(setBestanden)
      .catch(() => {})
  }, [])

  const login = (email: string, pin: string): 'ok' | 'fout' | 'wacht' => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.pin === pin
    )
    if (!user) return 'fout'
    if (!user.actief) return 'wacht'
    const now = new Date().toISOString()
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, laatstIngelogd: now } : u))
    setCurrentUser({ ...user, laatstIngelogd: now })
    sessionStorage.setItem(SESSION_KEY, user.id)
    return 'ok'
  }

  const activeerUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, actief: true } : u))
    if (user) verstuurEmail('activatie', user.email, { naam: user.naam })
  }

  const deactiveerUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, actief: false } : u))
  }

  const afwijsUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  const addUserDirect = (data: Omit<User, 'id' | 'taken' | 'aangemeldOp' | 'laatstIngelogd'>): { ok: boolean; error?: string } => {
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: 'Dit e-mailadres is al in gebruik.' }
    }
    const currentTaken = loadTaken()
    const newUser: User = {
      ...data,
      id: `u_${Date.now()}`,
      aangemeldOp: new Date().toISOString().split('T')[0],
      taken: currentTaken.map(t => ({ taskId: t.id, voltooid: false })),
    }
    setUsers(prev => [...prev, newUser])
    return { ok: true }
  }

  const updateUser = (data: Pick<User, 'id' | 'naam' | 'email' | 'pin' | 'pelotoon' | 'rol'>): { ok: boolean; error?: string } => {
    const conflict = users.find(u => u.id !== data.id && u.email.toLowerCase() === data.email.toLowerCase())
    if (conflict) return { ok: false, error: 'Dit e-mailadres is al in gebruik.' }
    setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u))
    return { ok: true }
  }

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  const setPinByEmail = (email: string, pin: string): boolean => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!exists) return false
    setUsers(prev => prev.map(u =>
      u.email.toLowerCase() === email.toLowerCase() ? { ...u, pin } : u
    ))
    return true
  }

  const register = (
    naam: string,
    email: string,
    pin: string,
    pelotoon: string
  ): { ok: boolean; error?: string } => {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Dit e-mailadres is al geregistreerd.' }
    }
    const currentTaken = loadTaken()
    const newUser: User = {
      id: `u_${Date.now()}`,
      naam,
      email,
      pin,
      rol: 'reservist',
      pelotoon,
      aangemeldOp: new Date().toISOString().split('T')[0],
      actief: false,
      taken: currentTaken.map(t => ({ taskId: t.id, voltooid: false })),
    }
    setUsers(prev => [...prev, newUser])
    verstuurEmail('registratie', email, { naam })
    verstuurEmail('registratie_admin', '', { naam, email, pelotoon })
    return { ok: true }
  }

  const logout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  const updateUserRole = (userId: string, rol: UserRole) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, rol } : u)))
  }

  const toggleTask = (taskId: string) => {
    if (!currentUser) return
    const today = new Date().toISOString().split('T')[0]
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== currentUser.id) return u
        return {
          ...u,
          taken: u.taken.map(t =>
            t.taskId === taskId
              ? {
                  ...t,
                  voltooid: !t.voltooid,
                  voltooiDatum: !t.voltooid ? today : undefined,
                }
              : t
          ),
        }
      })
    )
  }

  const setOpmerking = (taskId: string, opmerking: string) => {
    if (!currentUser) return
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== currentUser.id) return u
        return {
          ...u,
          taken: u.taken.map(t =>
            t.taskId === taskId ? { ...t, opmerking: opmerking || undefined } : t
          ),
        }
      })
    )
  }

  const moveTaakOmhoog = (id: string) => {
    setTaken(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx <= 0) return prev
      const updated = [...prev]
      ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
      return updated
    })
  }

  const moveTaakOmlaag = (id: string) => {
    setTaken(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const updated = [...prev]
      ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
      return updated
    })
  }

  const addTaak = (taak: Omit<Taak, 'id'>) => {
    const id = `t_${Date.now()}`
    const newTaak: Taak = { ...taak, id }
    setTaken(prev => [...prev, newTaak])
    setUsers(prev =>
      prev.map(u => ({
        ...u,
        taken: [...u.taken, { taskId: id, voltooid: false }],
      }))
    )
  }

  const updateTaak = (taak: Taak) => {
    setTaken(prev => prev.map(t => (t.id === taak.id ? taak : t)))
  }

  const deleteTaak = (id: string) => {
    setTaken(prev =>
      prev
        .filter(t => t.id !== id)
        .map(t => t.vereistTaakId === id ? { ...t, vereistTaakId: undefined } : t)
    )
    setUsers(prev =>
      prev.map(u => ({
        ...u,
        taken: u.taken.filter(t => t.taskId !== id),
      }))
    )
  }

  const addContact = (contact: Omit<Contact, 'id'>) => {
    const id = `c_${Date.now()}`
    setContacten(prev => [...prev, { ...contact, id }])
  }

  const updateContact = (contact: Contact) => {
    setContacten(prev => prev.map(c => (c.id === contact.id ? contact : c)))
  }

  const deleteContact = (id: string) => {
    setContacten(prev => prev.filter(c => c.id !== id))
  }

  const uploadBestand = async (file: File, naam: string, beschrijving: string, categorie: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('naam', naam.trim() || file.name)
    formData.append('beschrijving', beschrijving)
    formData.append('categorie', categorie)
    formData.append('geuploadDoor', currentUser?.naam ?? 'Onbekend')

    const res = await fetch('/api/bestanden', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Upload mislukt')
    const nieuw: Bestand = await res.json()
    setBestanden(prev => [...prev, nieuw])
  }

  const deleteBestand = async (id: string): Promise<void> => {
    const res = await fetch(`/api/bestanden/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Verwijderen mislukt')
    setBestanden(prev => prev.filter(b => b.id !== id))
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser, users, taken, contacten,
        login, register, logout, updateUserRole,
        activeerUser, deactiveerUser, afwijsUser, addUserDirect, updateUser, deleteUser, setPinByEmail,
        toggleTask, setOpmerking,
        moveTaakOmhoog, moveTaakOmlaag, addTaak, updateTaak, deleteTaak,
        addContact, updateContact, deleteContact,
        bestanden, uploadBestand, deleteBestand,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
