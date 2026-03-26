import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, UserRole } from '../types'
import { DEMO_USERS, TAKEN } from '../data/dummyData'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  login: (email: string, pin: string) => boolean
  register: (naam: string, email: string, pin: string, pelotoon: string) => { ok: boolean; error?: string }
  logout: () => void
  updateUserRole: (userId: string, rol: UserRole) => void
  toggleTask: (taskId: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'acie_users_v1'
const SESSION_KEY = 'acie_session_v1'

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEMO_USERS
  } catch {
    return DEMO_USERS
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers)
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
    const newUser: User = {
      id: `u_${Date.now()}`,
      naam,
      email,
      pin,
      rol: 'reservist',
      pelotoon,
      aangemeldOp: new Date().toISOString().split('T')[0],
      taken: TAKEN.map(t => ({ taskId: t.id, voltooid: false })),
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

  return (
    <AuthContext.Provider
      value={{ currentUser, users, login, register, logout, updateUserRole, toggleTask }}
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
