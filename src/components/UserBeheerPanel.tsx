import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { User, UserRole } from '../types'
import {
  UserCheck, UserX, Clock, Plus, Pencil, Trash2, X, Check,
  ShieldOff, Shield, KeyRound,
} from 'lucide-react'

const ROL_KLEUREN: Record<UserRole, string> = {
  reservist: 'bg-army-100 text-army-700',
  groepscommandant: 'bg-teal-100 text-teal-700',
  commandant: 'bg-blue-100 text-blue-700',
  beheerder: 'bg-gold-300 text-amber-800',
}

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

type GebruikerForm = {
  naam: string
  email: string
  pelotoonId: string
  groepId: string
  rol: UserRole
  actief: boolean
}

type FormVeldenProps = {
  form: GebruikerForm
  onChange: (patch: Partial<GebruikerForm>) => void
  groepenLijst: { id: string; naam: string; pelotoonId: string }[]
  onPelotoonChange: (id: string) => void
  errors?: string
  pelotoonOpties: { id: string; naam: string }[]
  beschikbareRollen: UserRole[]
  rolLabels: Record<UserRole, string>
  naamPeloton: string
  naamGroep: string
  isGroepscommandant: boolean
  currentUser: { pelotoonNaam?: string; groepNaam?: string | null } | null
}

function GebruikerFormVelden({
  form, onChange, groepenLijst, onPelotoonChange, errors,
  pelotoonOpties, beschikbareRollen, rolLabels, naamPeloton, naamGroep,
  isGroepscommandant, currentUser,
}: FormVeldenProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">Naam *</label>
        <input type="text" value={form.naam} onChange={e => onChange({ naam: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">E-mail *</label>
        <input type="email" value={form.email} onChange={e => onChange({ email: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">{naamPeloton} *</label>
        {isGroepscommandant ? (
          <input type="text" value={currentUser?.pelotoonNaam ?? ''} disabled className={INPUT + ' bg-army-50 text-army-500'} />
        ) : (
          <select value={form.pelotoonId} onChange={e => onPelotoonChange(e.target.value)} className={INPUT}>
            <option value="">Selecteer…</option>
            {pelotoonOpties.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
          </select>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">{naamGroep}</label>
        {isGroepscommandant ? (
          <input type="text" value={currentUser?.groepNaam ?? ''} disabled className={INPUT + ' bg-army-50 text-army-500'} />
        ) : (
          <select value={form.groepId} onChange={e => onChange({ groepId: e.target.value })} className={INPUT} disabled={!form.pelotoonId}>
            <option value="">— Geen {naamGroep.toLowerCase()} —</option>
            {groepenLijst.map(g => <option key={g.id} value={g.id}>{g.naam}</option>)}
          </select>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">Rol</label>
        <select value={form.rol} onChange={e => onChange({ rol: e.target.value as UserRole })} className={INPUT}>
          {beschikbareRollen.map(r => <option key={r} value={r}>{rolLabels[r]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-army-600 mb-1">Status</label>
        <select value={form.actief ? 'actief' : 'inactief'} onChange={e => onChange({ actief: e.target.value === 'actief' })} className={INPUT}>
          <option value="actief">Actief</option>
          <option value="inactief">Inactief</option>
        </select>
      </div>
      {errors && <div className="col-span-2 text-red-600 text-xs">{errors}</div>}
    </div>
  )
}

const leegFormulier = (): GebruikerForm => ({
  naam: '', email: '', pelotoonId: '', groepId: '', rol: 'reservist', actief: true,
})

export function UserBeheerPanel() {
  const {
    users, currentUser, appConfig, pelotonen, groepen,
    activeerUser, deactiveerUser, afwijsUser,
    addUserDirect, updateUser, deleteUser,
  } = useAuth()

  const [nieuwOpen, setNieuwOpen] = useState(false)
  const [nieuwForm, setNieuwForm] = useState<GebruikerForm>(leegFormulier())
  const [nieuwError, setNieuwError] = useState('')

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [bewerkForm, setBewerkForm] = useState<GebruikerForm>(leegFormulier())
  const [bewerkError, setBewerkError] = useState('')
  const [resetBevestig, setResetBevestig] = useState<string | null>(null)
  const [resetVerstuurd, setResetVerstuurd] = useState<string | null>(null)
  const [resetMelding, setResetMelding] = useState<{ naam: string } | null>(null)
  const [verwijderId, setVerwijderId] = useState<string | null>(null)

  const aanvragerRol = currentUser?.rol
  const isBeheerder = aanvragerRol === 'beheerder'
  const isCommandant = aanvragerRol === 'commandant'
  const isGroepscommandant = aanvragerRol === 'groepscommandant'

  const rolLabels: Record<UserRole, string> = {
    reservist: appConfig?.naamReservist || 'Reservist',
    groepscommandant: appConfig?.naamGroepscommandant || 'Groepscommandant',
    commandant: appConfig?.naamCommandant || 'Pelotonscommandant',
    beheerder: 'Beheerder',
  }
  const naamPeloton = appConfig?.naamPeloton || 'Peloton'
  const naamGroep = appConfig?.naamGroep || 'Groep'

  const beschikbareRollen: UserRole[] = isBeheerder
    ? ['reservist', 'groepscommandant', 'commandant', 'beheerder']
    : isCommandant
      ? ['reservist', 'groepscommandant']
      : ['reservist']

  // Peloton-opties in formulier
  const pelotoonOpties = isBeheerder
    ? pelotonen
    : pelotonen.filter(p => p.id === currentUser?.pelotoonId)

  // Groep-opties gefilterd op geselecteerd peloton
  const groepenVoorNieuw = groepen.filter(g => g.pelotoonId === nieuwForm.pelotoonId)
  const groepenVoorBewerk = groepen.filter(g => g.pelotoonId === bewerkForm.pelotoonId)

  const wachtend = users.filter(u => !u.actief)
  const actief = users.filter(u => u.actief && u.id !== currentUser?.id)

  const openBewerk = (u: User) => {
    setBewerkId(u.id)
    setBewerkForm({
      naam: u.naam, email: u.email,
      pelotoonId: u.pelotoonId, groepId: u.groepId ?? '',
      rol: u.rol, actief: u.actief,
    })
    setBewerkError('')
  }

  const handleNieuwPelotoonChange = (id: string) => {
    setNieuwForm(f => ({ ...f, pelotoonId: id, groepId: '' }))
  }

  const handleBewerkPelotoonChange = (id: string) => {
    setBewerkForm(f => ({ ...f, pelotoonId: id, groepId: '' }))
  }

  const stuurPinReset = async (u: User) => {
    try {
      await fetch('/api/auth/pin-reset/aanvragen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      })
    } catch { /* stil falen */ }
    setResetVerstuurd(u.id)
    setResetMelding({ naam: u.naam })
    setTimeout(() => setResetVerstuurd(null), 3000)
    setTimeout(() => setResetMelding(null), 6000)
  }

  const slaNieuwOp = async () => {
    if (!nieuwForm.naam.trim() || !nieuwForm.email.trim() || !nieuwForm.pelotoonId) return
    // Groepscommandant: vul peloton+groep automatisch in
    const data = isGroepscommandant
      ? { ...nieuwForm, pelotoonId: currentUser!.pelotoonId, groepId: currentUser!.groepId ?? '' }
      : nieuwForm
    const result = await addUserDirect({
      naam: data.naam, email: data.email,
      pelotoonId: data.pelotoonId, groepId: data.groepId || null,
      rol: data.rol, actief: data.actief,
    })
    if (!result.ok) { setNieuwError(result.error ?? 'Mislukt.'); return }
    setNieuwOpen(false)
    setNieuwForm(leegFormulier())
    setNieuwError('')
  }

  const slaBewerkOp = async () => {
    if (!bewerkId) return
    if (!bewerkForm.naam.trim() || !bewerkForm.email.trim() || !bewerkForm.pelotoonId) return
    const result = await updateUser({
      id: bewerkId, naam: bewerkForm.naam, email: bewerkForm.email,
      pelotoonId: bewerkForm.pelotoonId, groepId: bewerkForm.groepId || null,
      rol: bewerkForm.rol, actief: bewerkForm.actief,
    })
    if (!result.ok) { setBewerkError(result.error ?? 'Mislukt.'); return }
    setBewerkId(null)
    setBewerkError('')
  }

  const formProps = { pelotoonOpties, beschikbareRollen, rolLabels, naamPeloton, naamGroep, isGroepscommandant, currentUser }

  return (
    <div className="space-y-4">
      {/* PIN-reset bevestiging */}
      {resetMelding && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <KeyRound size={16} className="text-green-600 flex-shrink-0" />
          <span className="text-green-800 text-sm">
            PIN-reset e-mail verstuurd naar <strong>{resetMelding.naam}</strong>. De gebruiker ontvangt een link om een nieuwe pincode in te stellen.
          </span>
        </div>
      )}

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
                <div className="text-army-400 text-xs truncate">{u.email} · {u.pelotoonNaam}{u.groepNaam ? ` · ${u.groepNaam}` : ''}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => void activeerUser(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors">
                  <UserCheck size={13} /> Activeer
                </button>
                <button onClick={() => void afwijsUser(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors">
                  <UserX size={13} /> Afwijzen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nieuw gebruiker */}
      {!nieuwOpen ? (
        <button
          onClick={() => {
            const init = leegFormulier()
            if (isGroepscommandant && currentUser) {
              init.pelotoonId = currentUser.pelotoonId
              init.groepId = currentUser.groepId ?? ''
            } else if (isCommandant && currentUser) {
              init.pelotoonId = currentUser.pelotoonId
            }
            setNieuwOpen(true); setNieuwForm(init); setNieuwError('')
          }}
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
          <GebruikerFormVelden
            {...formProps}
            form={nieuwForm}
            onChange={p => setNieuwForm(f => ({ ...f, ...p }))}
            groepenLijst={groepenVoorNieuw}
            onPelotoonChange={handleNieuwPelotoonChange}
            errors={nieuwError}
          />
          <p className="text-army-400 text-xs">De gebruiker ontvangt een e-mail om zelf een pincode in te stellen.</p>
          <button
            onClick={slaNieuwOp}
            disabled={!nieuwForm.naam.trim() || !nieuwForm.email.trim() || (!isGroepscommandant && !nieuwForm.pelotoonId)}
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
                <GebruikerFormVelden
                  {...formProps}
                  form={bewerkForm}
                  onChange={p => setBewerkForm(f => ({ ...f, ...p }))}
                  groepenLijst={groepenVoorBewerk}
                  onPelotoonChange={handleBewerkPelotoonChange}
                  errors={bewerkError}
                />
                <button
                  onClick={slaBewerkOp}
                  disabled={!bewerkForm.naam.trim() || !bewerkForm.email.trim() || !bewerkForm.pelotoonId}
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_KLEUREN[u.rol]}`}>{rolLabels[u.rol]}</span>
                    {!u.actief && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactief</span>}
                  </div>
                  <div className="text-army-400 text-xs truncate">
                    {u.email} · {u.pelotoonNaam}{u.groepNaam ? ` · ${u.groepNaam}` : ''}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openBewerk(u)} className="p-1.5 rounded-lg text-army-400 hover:text-army-800 hover:bg-army-50 transition-colors" title="Bewerken">
                    <Pencil size={14} />
                  </button>
                  {resetBevestig === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { void stuurPinReset(u); setResetBevestig(null) }} className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors" title="Bevestig reset">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setResetBevestig(null)} className="p-1.5 rounded-lg text-army-400 hover:bg-army-50 transition-colors" title="Annuleer">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetBevestig(u.id)}
                      className={`p-1.5 rounded-lg transition-colors ${resetVerstuurd === u.id ? 'text-green-600 bg-green-50' : 'text-army-400 hover:text-army-800 hover:bg-army-50'}`}
                      title="PIN-reset e-mail sturen"
                    >
                      <KeyRound size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => void (u.actief ? deactiveerUser(u.id) : activeerUser(u.id))}
                    className="p-1.5 rounded-lg text-army-400 hover:text-army-800 hover:bg-army-50 transition-colors"
                    title={u.actief ? 'Deactiveren' : 'Activeren'}
                  >
                    {u.actief ? <ShieldOff size={14} /> : <Shield size={14} />}
                  </button>
                  {verwijderId === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { void deleteUser(u.id); setVerwijderId(null) }} className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
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
