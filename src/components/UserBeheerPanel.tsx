import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PELOTONEN } from '../data/dummyData'
import type { User, UserRole } from '../types'
import {
  UserCheck, UserX, Clock, Plus, Pencil, Trash2, X, Check,
  ShieldOff, Shield,
} from 'lucide-react'

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

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

type GebruikerForm = {
  naam: string
  email: string
  pin: string
  pelotoon: string
  rol: UserRole
  actief: boolean
}

const leegFormulier = (): GebruikerForm => ({
  naam: '', email: '', pin: '', pelotoon: '', rol: 'reservist', actief: true,
})

export function UserBeheerPanel() {
  const {
    users, currentUser,
    activeerUser, deactiveerUser, afwijsUser,
    addUserDirect, updateUser, deleteUser,
  } = useAuth()

  const [nieuwOpen, setNieuwOpen] = useState(false)
  const [nieuwForm, setNieuwForm] = useState<GebruikerForm>(leegFormulier())
  const [nieuwError, setNieuwError] = useState('')

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [bewerkForm, setBewerkForm] = useState<GebruikerForm>(leegFormulier())
  const [bewerkError, setBewerkError] = useState('')

  const [verwijderId, setVerwijderId] = useState<string | null>(null)

  const wachtend = users.filter(u => !u.actief)
  const actief = users.filter(u => u.actief && u.id !== currentUser?.id)

  const openBewerk = (u: User) => {
    setBewerkId(u.id)
    setBewerkForm({ naam: u.naam, email: u.email, pin: u.pin, pelotoon: u.pelotoon, rol: u.rol, actief: u.actief })
    setBewerkError('')
  }

  const slaNieuwOp = () => {
    if (!nieuwForm.naam.trim() || !nieuwForm.email.trim() || nieuwForm.pin.length !== 4 || !nieuwForm.pelotoon) return
    const result = addUserDirect(nieuwForm)
    if (!result.ok) { setNieuwError(result.error ?? 'Mislukt.'); return }
    setNieuwOpen(false)
    setNieuwForm(leegFormulier())
    setNieuwError('')
  }

  const slaBewerkOp = () => {
    if (!bewerkId) return
    if (!bewerkForm.naam.trim() || !bewerkForm.email.trim() || bewerkForm.pin.length !== 4 || !bewerkForm.pelotoon) return
    const result = updateUser({ id: bewerkId, ...bewerkForm })
    if (!result.ok) { setBewerkError(result.error ?? 'Mislukt.'); return }
    setBewerkId(null)
    setBewerkError('')
  }

  const GebruikerFormVelden = ({
    form, onChange, error,
  }: {
    form: GebruikerForm
    onChange: (f: GebruikerForm) => void
    error: string
  }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Naam *</label>
          <input type="text" value={form.naam} onChange={e => onChange({ ...form, naam: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">E-mail *</label>
          <input type="email" value={form.email} onChange={e => onChange({ ...form, email: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">PIN (4 cijfers) *</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={form.pin}
            onChange={e => onChange({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            className={INPUT}
            placeholder="••••"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Peloton *</label>
          <select value={form.pelotoon} onChange={e => onChange({ ...form, pelotoon: e.target.value })} className={INPUT}>
            <option value="">Selecteer…</option>
            {PELOTONEN.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Rol</label>
          <select value={form.rol} onChange={e => onChange({ ...form, rol: e.target.value as UserRole })} className={INPUT}>
            {(Object.keys(ROL_LABELS) as UserRole[]).map(r => (
              <option key={r} value={r}>{ROL_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Status</label>
          <select value={form.actief ? 'actief' : 'inactief'} onChange={e => onChange({ ...form, actief: e.target.value === 'actief' })} className={INPUT}>
            <option value="actief">Actief</option>
            <option value="inactief">Inactief</option>
          </select>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Wachtende activaties */}
      {wachtend.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">Wachtende activaties ({wachtend.length})</span>
          </div>
          {wachtend.map(u => (
            <div key={u.id} className="bg-white rounded-lg border border-amber-100 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {u.naam.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-army-900 text-sm">{u.naam}</div>
                <div className="text-army-400 text-xs truncate">{u.email} · {u.pelotoon}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => activeerUser(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors">
                  <UserCheck size={13} /> Activeer
                </button>
                <button onClick={() => afwijsUser(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors">
                  <UserX size={13} /> Afwijzen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nieuw gebruiker knop / formulier */}
      {!nieuwOpen ? (
        <button
          onClick={() => { setNieuwOpen(true); setNieuwForm(leegFormulier()); setNieuwError('') }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-army-300 text-army-600 hover:border-army-500 hover:text-army-800 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nieuwe gebruiker aanmaken
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-army-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-army-800 text-sm">Nieuwe gebruiker</span>
            <button onClick={() => setNieuwOpen(false)} className="text-army-400 hover:text-army-700"><X size={16} /></button>
          </div>
          <GebruikerFormVelden form={nieuwForm} onChange={setNieuwForm} error={nieuwError} />
          <button
            onClick={slaNieuwOp}
            disabled={!nieuwForm.naam.trim() || !nieuwForm.email.trim() || nieuwForm.pin.length !== 4 || !nieuwForm.pelotoon}
            className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 transition-colors"
          >
            Gebruiker aanmaken
          </button>
        </div>
      )}

      {/* Gebruikerslijst */}
      <div className="space-y-2">
        {actief.map(u => (
          <div key={u.id} className="bg-white rounded-xl border border-army-100 shadow-sm overflow-hidden">
            {bewerkId === u.id ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-army-800 text-sm">Gebruiker bewerken</span>
                  <button onClick={() => setBewerkId(null)} className="text-army-400 hover:text-army-700"><X size={16} /></button>
                </div>
                <GebruikerFormVelden form={bewerkForm} onChange={setBewerkForm} error={bewerkError} />
                <button
                  onClick={slaBewerkOp}
                  disabled={!bewerkForm.naam.trim() || !bewerkForm.email.trim() || bewerkForm.pin.length !== 4 || !bewerkForm.pelotoon}
                  className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 transition-colors"
                >
                  Wijzigingen opslaan
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-army-100 text-army-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {u.naam.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-army-900 text-sm">{u.naam}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_KLEUREN[u.rol]}`}>{ROL_LABELS[u.rol]}</span>
                    {!u.actief && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactief</span>}
                  </div>
                  <div className="text-army-400 text-xs truncate">{u.email} · {u.pelotoon}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openBewerk(u)} className="p-1.5 rounded-lg text-army-400 hover:text-army-800 hover:bg-army-50 transition-colors" title="Bewerken">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => u.actief ? deactiveerUser(u.id) : activeerUser(u.id)}
                    className="p-1.5 rounded-lg text-army-400 hover:text-army-800 hover:bg-army-50 transition-colors"
                    title={u.actief ? 'Deactiveren' : 'Activeren'}
                  >
                    {u.actief ? <ShieldOff size={14} /> : <Shield size={14} />}
                  </button>
                  {verwijderId === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteUser(u.id); setVerwijderId(null) }} className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setVerwijderId(null)} className="p-1.5 rounded-lg text-army-400 hover:bg-army-50 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setVerwijderId(u.id)} className="p-1.5 rounded-lg text-army-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Verwijderen">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {actief.length === 0 && (
          <div className="text-center py-10 text-army-400 text-sm bg-white rounded-xl border border-army-100">
            Geen gebruikers gevonden.
          </div>
        )}
      </div>
    </div>
  )
}
