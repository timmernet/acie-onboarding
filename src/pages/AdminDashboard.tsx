import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'
import { Shield, UserCheck, Users, Search } from 'lucide-react'

const ROL_LABELS: Record<UserRole, string> = {
  reservist: 'Reservist',
  commandant: 'Commandant',
  beheerder: 'Beheerder',
}

const ROL_KLEUREN: Record<UserRole, string> = {
  reservist: 'bg-army-100 text-army-700',
  commandant: 'bg-blue-100 text-blue-700',
  beheerder: 'bg-gold-300 text-amber-800',
}

export function AdminDashboard() {
  const { users, currentUser, updateUserRole } = useAuth()
  const [zoek, setZoek] = useState('')

  const gefilterd = users
    .filter(u => u.id !== currentUser?.id)
    .filter(u => {
      const q = zoek.toLowerCase()
      return (
        u.naam.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.pelotoon.toLowerCase().includes(q)
      )
    })

  const totaalReservisten = users.filter(u => u.rol === 'reservist').length
  const totaalCommandanten = users.filter(u => u.rol === 'commandant').length
  const totaalBeheerders = users.filter(u => u.rol === 'beheerder').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-army-900 font-bold text-xl flex items-center gap-2">
          <Shield size={20} /> Gebruikersbeheer
        </h2>
        <p className="text-army-500 text-sm mt-0.5">Beheer rollen en rechten van alle gebruikers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-army-100 shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <Users size={20} className="text-army-500" />
          </div>
          <div className="text-xl font-extrabold text-army-800">{totaalReservisten}</div>
          <div className="text-army-400 text-xs mt-0.5">Reservisten</div>
        </div>
        <div className="bg-white rounded-xl border border-army-100 shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <UserCheck size={20} className="text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-blue-700">{totaalCommandanten}</div>
          <div className="text-army-400 text-xs mt-0.5">Commandanten</div>
        </div>
        <div className="bg-white rounded-xl border border-army-100 shadow-sm p-4 text-center">
          <div className="flex justify-center mb-2">
            <Shield size={20} className="text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-700">{totaalBeheerders}</div>
          <div className="text-army-400 text-xs mt-0.5">Beheerders</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-army-400" />
        <input
          type="text"
          placeholder="Zoek op naam, e-mail of peloton…"
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm shadow-sm"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {gefilterd.map(user => (
          <div key={user.id} className="bg-white rounded-xl border border-army-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-army-100 text-army-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user.naam.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-army-900 text-sm">{user.naam}</div>
                <div className="text-army-400 text-xs truncate">{user.email}</div>
                <div className="text-army-400 text-xs">{user.pelotoon} · Lid sinds {new Date(user.aangemeldOp).toLocaleDateString('nl-NL')}</div>
              </div>

              {/* Current role badge + selector */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROL_KLEUREN[user.rol]}`}>
                  {ROL_LABELS[user.rol]}
                </span>
              </div>
            </div>

            {/* Role selector */}
            <div className="mt-3 pt-3 border-t border-army-50">
              <div className="text-xs text-army-500 mb-2 font-medium">Rol aanpassen:</div>
              <div className="flex gap-2 flex-wrap">
                {(['reservist', 'commandant', 'beheerder'] as UserRole[]).map(rol => (
                  <button
                    key={rol}
                    onClick={() => updateUserRole(user.id, rol)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      user.rol === rol
                        ? 'bg-army-700 text-white border-army-700'
                        : 'bg-white text-army-600 border-army-200 hover:border-army-500 hover:text-army-800'
                    }`}
                  >
                    {ROL_LABELS[rol]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {gefilterd.length === 0 && (
          <div className="text-center py-12 text-army-400 text-sm bg-white rounded-xl border border-army-100">
            Geen gebruikers gevonden.
          </div>
        )}
      </div>
    </div>
  )
}
