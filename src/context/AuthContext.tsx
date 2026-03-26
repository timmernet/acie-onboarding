import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, UserRole, Taak, Contact } from '../types'
import { DEMO_USERS, TAKEN as INIT_TAKEN, CONTACTEN as INIT_CONTACTEN } from '../data/dummyData'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  taken: Taak[]
  contacten: Contact[]
  login: (email: string, pin: string) => boolean
  register: (naam: string, email: string, pin: string, pelotoon: string) => { ok: boolean; error?: string }
  logout: () => void
  updateUserRole: (userId: string, rol: UserRole) => void
  toggleTask: (taskId: string) => void
  addTaak: (taak: Omit<Taak, 'id'>) => void
  updateTaak: (taak: Taak) => void
  deleteTaak: (id: string) => void
  addContact: (contact: Omit<Contact, 'id'>) => void
  updateContact: (contact: Contact) => void
  deleteContact: (id: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'acie_users_v1'
const SESSION_KEY = 'acie_session_v1'
const TAKEN_KEY = 'acie_taken_v1'
const CONTACTEN_KEY = 'acie_contacten_v1'

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEMO_USERS
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

  const login = (email: string, pin: string): boolean => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.pin === pin
    )
    if (!user) return false
    setCurrentUser(user)
    sessionStorage.setItem(SESSION_KEY, user.id)
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
      taken: currentTaken.map(t => ({ taskId: t.id, voltooid: false })),
    }
    setUsers(prev => [...prev, newUser])
    setCurrentUser(newUser)
    sessionStorage.setItem(SESSION_KEY, newUser.id)
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
    setTaken(prev => prev.filter(t => t.id !== id))
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

  return (
    <AuthContext.Provider
      value={{
        currentUser, users, taken, contacten,
        login, register, logout, updateUserRole, toggleTask,
        addTaak, updateTaak, deleteTaak,
        addContact, updateContact, deleteContact,
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
