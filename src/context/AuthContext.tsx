import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, UserRole, Taak, Contact, Bestand, AppConfig, Peloton, Groep } from '../types'
import { applyArmyTheme } from '../utils/applyTheme'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  taken: Taak[]
  contacten: Contact[]
  bestanden: Bestand[]
  pelotonen: Peloton[]
  groepen: Groep[]
  appConfig: AppConfig | null
  loading: boolean
  updateEmailConfig: (data: Partial<AppConfig> & { emailPass?: string; emailClientSecret?: string }) => Promise<{ ok: boolean; error?: string }>
  updateThemaConfig: (data: Partial<AppConfig>) => Promise<{ ok: boolean; error?: string }>
  addPeloton: (naam: string) => Promise<{ ok: boolean; error?: string }>
  updatePeloton: (id: string, naam: string) => Promise<{ ok: boolean; error?: string }>
  deletePeloton: (id: string) => Promise<{ ok: boolean; error?: string }>
  addGroep: (naam: string, pelotoonId: string) => Promise<{ ok: boolean; error?: string }>
  updateGroep: (id: string, naam: string) => Promise<{ ok: boolean; error?: string }>
  deleteGroep: (id: string) => Promise<{ ok: boolean; error?: string }>
  login: (email: string, pin: string) => Promise<{ result: 'ok' | 'fout' | 'wacht' | 'geblokkeerd'; pogingenOver?: number; geblokkerdTot?: string }>
  logout: () => Promise<void>
  register: (naam: string, email: string, pin: string, pelotoonId: string, groepId?: string) => Promise<{ ok: boolean; error?: string }>
  activeerUser: (userId: string) => Promise<void>
  deactiveerUser: (userId: string) => Promise<void>
  afwijsUser: (userId: string) => Promise<void>
  addUserDirect: (data: Omit<User, 'id' | 'taken' | 'aangemeldOp' | 'laatstIngelogd' | 'pelotoonNaam' | 'groepNaam'>) => Promise<{ ok: boolean; error?: string }>
  updateUser: (data: Pick<User, 'id' | 'naam' | 'email' | 'pelotoonId' | 'groepId' | 'rol' | 'actief'>) => Promise<{ ok: boolean; error?: string }>
  deleteUser: (userId: string) => Promise<void>
  updateUserRole: (userId: string, rol: UserRole) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  markeerTaakGezien: (taskId: string) => Promise<void>
  setOpmerking: (taskId: string, opmerking: string) => Promise<void>
  moveTaakOmhoog: (id: string) => Promise<void>
  moveTaakOmlaag: (id: string) => Promise<void>
  addTaak: (taak: Omit<Taak, 'id'>) => Promise<void>
  updateTaak: (taak: Taak) => Promise<void>
  deleteTaak: (id: string) => Promise<void>
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>
  updateContact: (contact: Contact) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  uploadBestand: (file: File, naam: string, beschrijving: string, categorie: string) => Promise<void>
  deleteBestand: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await fetch(path, { credentials: 'include', ...options })
    const data = await res.json().catch(() => null)
    if (!res.ok) return { data: null, error: data?.error ?? 'Er is een fout opgetreden', status: res.status }
    return { data: data as T, error: null, status: res.status }
  } catch {
    return { data: null, error: 'Netwerkfout — controleer de verbinding', status: 0 }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [taken, setTaken] = useState<Taak[]>([])
  const [contacten, setContacten] = useState<Contact[]>([])
  const [bestanden, setBestanden] = useState<Bestand[]>([])
  const [pelotonen, setPelotonen] = useState<Peloton[]>([])
  const [groepen, setGroepen] = useState<Groep[]>([])
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const laadUsers = useCallback(async () => {
    const { data } = await api<User[]>('/api/users')
    if (data) setUsers(data)
  }, [])

  const laadAlles = useCallback(async () => {
    const [meRes, takenRes, contactenRes, bestandenRes, configRes, pelotonenRes, groepenRes] = await Promise.all([
      api<User>('/api/auth/me'),
      api<Taak[]>('/api/taken'),
      api<Contact[]>('/api/contacten'),
      api<Bestand[]>('/api/bestanden'),
      api<AppConfig>('/api/config'),
      api<Peloton[]>('/api/pelotonen'),
      api<Groep[]>('/api/groepen'),
    ])

    if (meRes.data) {
      setCurrentUser(meRes.data)
      if (['commandant', 'beheerder', 'groepscommandant'].includes(meRes.data.rol)) {
        await laadUsers()
      }
    }
    if (takenRes.data) setTaken(takenRes.data)
    if (contactenRes.data) setContacten(contactenRes.data)
    if (bestandenRes.data) setBestanden(bestandenRes.data)
    if (configRes.data) {
      setAppConfig(configRes.data)
      if (configRes.data.primairKleur) applyArmyTheme(configRes.data.primairKleur)
    }
    if (pelotonenRes.data) setPelotonen(pelotonenRes.data)
    if (groepenRes.data) setGroepen(groepenRes.data)
  }, [laadUsers])

  useEffect(() => {
    laadAlles().finally(() => setLoading(false))
  }, [laadAlles])

  // --- Auth ---

  const login = async (email: string, pin: string): Promise<{ result: 'ok' | 'fout' | 'wacht' | 'geblokkeerd'; pogingenOver?: number; geblokkerdTot?: string }> => {
    const { data, error } = await api<{ result: string; user: User; pogingenOver?: number; geblokkerdTot?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    })
    if (error || !data) return { result: 'fout' }
    if (data.result === 'wacht') return { result: 'wacht' }
    if (data.result === 'geblokkeerd') return { result: 'geblokkeerd', geblokkerdTot: data.geblokkerdTot }
    if (data.result === 'fout') return { result: 'fout', pogingenOver: data.pogingenOver }
    if (data.result === 'ok' && data.user) {
      setCurrentUser(data.user)
      const [takenRes, contactenRes, bestandenRes, pelotonenRes, groepenRes] = await Promise.all([
        api<Taak[]>('/api/taken'),
        api<Contact[]>('/api/contacten'),
        api<Bestand[]>('/api/bestanden'),
        api<Peloton[]>('/api/pelotonen'),
        api<Groep[]>('/api/groepen'),
      ])
      if (takenRes.data) setTaken(takenRes.data)
      if (contactenRes.data) setContacten(contactenRes.data)
      if (bestandenRes.data) setBestanden(bestandenRes.data)
      if (pelotonenRes.data) setPelotonen(pelotonenRes.data)
      if (groepenRes.data) setGroepen(groepenRes.data)
      if (['commandant', 'beheerder', 'groepscommandant'].includes(data.user.rol)) {
        await laadUsers()
      }
      return { result: 'ok' }
    }
    return { result: 'fout' }
  }

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    setUsers([])
  }

  const register = async (naam: string, email: string, pin: string, pelotoonId: string, groepId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam, email, pin, pelotoonId, groepId }),
    })
    if (error) return { ok: false, error }
    return { ok: true }
  }

  // --- Gebruikersbeheer ---

  const activeerUser = async (userId: string) => {
    await api(`/api/users/${userId}/activeer`, { method: 'PATCH' })
    await laadUsers()
  }

  const deactiveerUser = async (userId: string) => {
    await api(`/api/users/${userId}/deactiveer`, { method: 'PATCH' })
    await laadUsers()
  }

  const afwijsUser = async (userId: string) => {
    await api(`/api/users/${userId}/afwijzen`, { method: 'PATCH' })
    await laadUsers()
  }

  const addUserDirect = async (data: Omit<User, 'id' | 'taken' | 'aangemeldOp' | 'laatstIngelogd' | 'pelotoonNaam' | 'groepNaam'>): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await api('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (error) return { ok: false, error }
    await laadUsers()
    return { ok: true }
  }

  const updateUser = async (data: Pick<User, 'id' | 'naam' | 'email' | 'pelotoonId' | 'groepId' | 'rol' | 'actief'>): Promise<{ ok: boolean; error?: string }> => {
    const { id, ...rest } = data
    const { error } = await api(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest),
    })
    if (error) return { ok: false, error }
    await laadUsers()
    return { ok: true }
  }

  const deleteUser = async (userId: string) => {
    await api(`/api/users/${userId}`, { method: 'DELETE' })
    await laadUsers()
  }

  const updateUserRole = async (userId: string, rol: UserRole) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    await updateUser({ id: userId, naam: user.naam, email: user.email, pelotoonId: user.pelotoonId, groepId: user.groepId, rol, actief: user.actief })
  }

  // --- Taken ---

  const toggleTask = async (taskId: string) => {
    const { data } = await api<{ taskId: string; voltooid: boolean; voltooiDatum?: string }>(
      `/api/taken/${taskId}/toggle`, { method: 'PATCH' }
    )
    if (!data || !currentUser) return
    setCurrentUser(prev => prev ? {
      ...prev,
      taken: prev.taken.map(t => t.taskId === taskId
        ? { ...t, voltooid: data.voltooid, voltooiDatum: data.voltooiDatum }
        : t
      ),
    } : prev)
  }

  const markeerTaakGezien = async (taskId: string) => {
    await api(`/api/taken/${taskId}/gezien`, { method: 'PATCH' })
    setCurrentUser(prev => prev ? {
      ...prev,
      taken: prev.taken.map(t => t.taskId === taskId ? { ...t, nieuw: false } : t),
    } : prev)
  }

  const setOpmerking = async (taskId: string, opmerking: string) => {
    await api(`/api/taken/${taskId}/opmerking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opmerking }),
    })
    setCurrentUser(prev => prev ? {
      ...prev,
      taken: prev.taken.map(t => t.taskId === taskId ? { ...t, opmerking: opmerking || undefined } : t),
    } : prev)
  }

  const moveTaakOmhoog = async (id: string) => {
    await api(`/api/taken/${id}/omhoog`, { method: 'PATCH' })
    const { data } = await api<Taak[]>('/api/taken')
    if (data) setTaken(data)
  }

  const moveTaakOmlaag = async (id: string) => {
    await api(`/api/taken/${id}/omlaag`, { method: 'PATCH' })
    const { data } = await api<Taak[]>('/api/taken')
    if (data) setTaken(data)
  }

  const addTaak = async (taak: Omit<Taak, 'id'>) => {
    const { data } = await api<Taak>('/api/taken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taak),
    })
    if (!data) return
    setTaken(prev => [...prev, data])
    // Voeg de nieuwe taak toe aan currentUser.taken met nieuw: true
    setCurrentUser(prev => prev ? {
      ...prev,
      taken: [...prev.taken, { taskId: data.id, voltooid: false, nieuw: true }],
    } : prev)
    // Herlaad gebruikerslijst zodat alle gebruikers de nieuwe taak hebben
    if (currentUser && ['commandant', 'beheerder', 'groepscommandant'].includes(currentUser.rol)) {
      await laadUsers()
    }
  }

  const updateTaak = async (taak: Taak) => {
    const { id, ...rest } = taak
    const { data } = await api<Taak>(`/api/taken/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest),
    })
    if (data) setTaken(prev => prev.map(t => t.id === id ? data : t))
  }

  const deleteTaak = async (id: string) => {
    await api(`/api/taken/${id}`, { method: 'DELETE' })
    setTaken(prev =>
      prev.filter(t => t.id !== id).map(t => t.vereistTaakId === id ? { ...t, vereistTaakId: undefined } : t)
    )
    setCurrentUser(prev => prev ? {
      ...prev,
      taken: prev.taken.filter(t => t.taskId !== id),
    } : prev)
    if (currentUser && ['commandant', 'beheerder', 'groepscommandant'].includes(currentUser.rol)) {
      await laadUsers()
    }
  }

  // --- Contacten ---

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    const { data } = await api<Contact>('/api/contacten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    if (data) setContacten(prev => [...prev, data])
  }

  const updateContact = async (contact: Contact) => {
    const { id, ...rest } = contact
    const { data } = await api<Contact>(`/api/contacten/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest),
    })
    if (data) setContacten(prev => prev.map(c => c.id === id ? data : c))
  }

  const deleteContact = async (id: string) => {
    await api(`/api/contacten/${id}`, { method: 'DELETE' })
    setContacten(prev => prev.filter(c => c.id !== id))
  }

  // --- Pelotonen & Groepen ---

  const addPeloton = async (naam: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await api<Peloton>('/api/pelotonen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam }),
    })
    if (error) return { ok: false, error }
    if (data) setPelotonen(prev => [...prev, data].sort((a, b) => a.naam.localeCompare(b.naam)))
    return { ok: true }
  }

  const updatePeloton = async (id: string, naam: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await api<Peloton>(`/api/pelotonen/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam }),
    })
    if (error) return { ok: false, error }
    if (data) setPelotonen(prev => prev.map(p => p.id === id ? data : p))
    return { ok: true }
  }

  const deletePeloton = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await api(`/api/pelotonen/${id}`, { method: 'DELETE' })
    if (error) return { ok: false, error }
    setPelotonen(prev => prev.filter(p => p.id !== id))
    return { ok: true }
  }

  const addGroep = async (naam: string, pelotoonId: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await api<Groep>('/api/groepen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam, pelotoonId }),
    })
    if (error) return { ok: false, error }
    if (data) setGroepen(prev => [...prev, data])
    return { ok: true }
  }

  const updateGroep = async (id: string, naam: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await api<Groep>(`/api/groepen/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam }),
    })
    if (error) return { ok: false, error }
    if (data) setGroepen(prev => prev.map(g => g.id === id ? data : g))
    return { ok: true }
  }

  const deleteGroep = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await api(`/api/groepen/${id}`, { method: 'DELETE' })
    if (error) return { ok: false, error }
    setGroepen(prev => prev.filter(g => g.id !== id))
    return { ok: true }
  }

  // --- App configuratie ---

  const updateEmailConfig = async (data: Partial<AppConfig> & { emailPass?: string }): Promise<{ ok: boolean; error?: string }> => {
    const { error, data: result } = await api<AppConfig>('/api/config/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (error) return { ok: false, error }
    if (result) setAppConfig(result)
    return { ok: true }
  }

  const updateThemaConfig = async (data: Partial<AppConfig>): Promise<{ ok: boolean; error?: string }> => {
    const { error, data: result } = await api<AppConfig>('/api/config/thema', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (error) return { ok: false, error }
    if (result) {
      setAppConfig(result)
      if (result.primairKleur) applyArmyTheme(result.primairKleur)
    }
    return { ok: true }
  }

  // --- Bestanden ---

  const uploadBestand = async (file: File, naam: string, beschrijving: string, categorie: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('naam', naam.trim() || file.name)
    formData.append('beschrijving', beschrijving)
    formData.append('categorie', categorie)
    formData.append('geuploadDoor', currentUser?.naam ?? 'Onbekend')

    const res = await fetch('/api/bestanden', { method: 'POST', body: formData, credentials: 'include' })
    if (!res.ok) throw new Error('Upload mislukt')
    const nieuw: Bestand = await res.json()
    setBestanden(prev => [...prev, nieuw])
  }

  const deleteBestand = async (id: string): Promise<void> => {
    const { error } = await api(`/api/bestanden/${id}`, { method: 'DELETE' })
    if (error) throw new Error(error)
    setBestanden(prev => prev.filter(b => b.id !== id))
  }

  return (
    <AuthContext.Provider value={{
      currentUser, users, taken, contacten, bestanden, pelotonen, groepen, appConfig, loading,
      login, logout, register,
      activeerUser, deactiveerUser, afwijsUser, addUserDirect, updateUser, deleteUser, updateUserRole,
      toggleTask, markeerTaakGezien, setOpmerking,
      moveTaakOmhoog, moveTaakOmlaag, addTaak, updateTaak, deleteTaak,
      addContact, updateContact, deleteContact,
      uploadBestand, deleteBestand,
      updateEmailConfig, updateThemaConfig,
      addPeloton, updatePeloton, deletePeloton,
      addGroep, updateGroep, deleteGroep,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
