import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

export function EenhedenPanel() {
  const {
    currentUser, appConfig, pelotonen, groepen,
    addPeloton, updatePeloton, deletePeloton,
    addGroep, updateGroep, deleteGroep,
  } = useAuth()

  const isBeheerder = currentUser?.rol === 'beheerder'
  const naamPeloton = appConfig?.naamPeloton || 'Peloton'
  const naamGroep = appConfig?.naamGroep || 'Groep'

  // Peloton state
  const [uitgevouwen, setUitgevouwen] = useState<Set<string>>(new Set())
  const [nieuwPelotoonNaam, setNieuwPelotoonNaam] = useState('')
  const [pelotoonError, setPelotoonError] = useState('')
  const [bewerkPelotoon, setBewerkPelotoon] = useState<{ id: string; naam: string } | null>(null)
  const [verwijderPelotoon, setVerwijderPelotoon] = useState<string | null>(null)

  // Groep state
  const [nieuwGroepPelotoonId, setNieuwGroepPelotoonId] = useState<string | null>(null)
  const [nieuwGroepNaam, setNieuwGroepNaam] = useState('')
  const [groepError, setGroepError] = useState<Record<string, string>>({})
  const [bewerkGroep, setBewerkGroep] = useState<{ id: string; naam: string } | null>(null)
  const [verwijderGroep, setVerwijderGroep] = useState<string | null>(null)

  const toggleUitvouwen = (id: string) => {
    setUitgevouwen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handlePelotoonToevoegen = async () => {
    if (!nieuwPelotoonNaam.trim()) return
    const result = await addPeloton(nieuwPelotoonNaam.trim())
    if (!result.ok) { setPelotoonError(result.error ?? 'Mislukt'); return }
    setNieuwPelotoonNaam('')
    setPelotoonError('')
  }

  const handlePelotoonOpslaan = async () => {
    if (!bewerkPelotoon || !bewerkPelotoon.naam.trim()) return
    const result = await updatePeloton(bewerkPelotoon.id, bewerkPelotoon.naam.trim())
    if (!result.ok) { setPelotoonError(result.error ?? 'Mislukt'); return }
    setBewerkPelotoon(null)
    setPelotoonError('')
  }

  const handlePelotoonVerwijderen = async (id: string) => {
    const result = await deletePeloton(id)
    if (!result.ok) { setPelotoonError(result.error ?? 'Mislukt'); return }
    setVerwijderPelotoon(null)
  }

  const handleGroepToevoegen = async (pelotoonId: string) => {
    if (!nieuwGroepNaam.trim()) return
    const result = await addGroep(nieuwGroepNaam.trim(), pelotoonId)
    if (!result.ok) { setGroepError(e => ({ ...e, [pelotoonId]: result.error ?? 'Mislukt' })); return }
    setNieuwGroepPelotoonId(null)
    setNieuwGroepNaam('')
    setGroepError(e => { const n = { ...e }; delete n[pelotoonId]; return n })
  }

  const handleGroepOpslaan = async () => {
    if (!bewerkGroep || !bewerkGroep.naam.trim()) return
    const result = await updateGroep(bewerkGroep.id, bewerkGroep.naam.trim())
    if (!result.ok) return
    setBewerkGroep(null)
  }

  const handleGroepVerwijderen = async (id: string) => {
    const groep = groepen.find(g => g.id === id)
    const result = await deleteGroep(id)
    if (!result.ok) {
      if (groep) setGroepError(e => ({ ...e, [groep.pelotoonId]: result.error ?? 'Mislukt' }))
      return
    }
    setVerwijderGroep(null)
  }

  // Pelotonen zichtbaar voor de aangemelde gebruiker
  const zichtbarePelotonen = isBeheerder
    ? pelotonen
    : pelotonen.filter(p => p.id === currentUser?.pelotoonId)

  return (
    <div className="space-y-4">
      {pelotoonError && (
        <div className="text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm">{pelotoonError}</div>
      )}

      {/* Pelotonen lijst */}
      {zichtbarePelotonen.map(peloton => {
        const isOpen = uitgevouwen.has(peloton.id)
        const groepenVanPeloton = groepen.filter(g => g.pelotoonId === peloton.id)

        return (
          <div key={peloton.id} className="bg-white rounded-xl border border-army-200 shadow-sm overflow-hidden">
            {/* Peloton header */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => toggleUitvouwen(peloton.id)} className="p-0.5 text-army-400 hover:text-army-700">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {bewerkPelotoon?.id === peloton.id ? (
                <input
                  type="text"
                  value={bewerkPelotoon.naam}
                  onChange={e => setBewerkPelotoon(p => p && ({ ...p, naam: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handlePelotoonOpslaan()}
                  className={INPUT + ' flex-1'}
                  autoFocus
                />
              ) : (
                <span className="flex-1 font-semibold text-army-900 text-sm">{peloton.naam}</span>
              )}

              <span className="text-xs text-army-400 mr-2">{groepenVanPeloton.length} {naamGroep.toLowerCase()}{groepenVanPeloton.length !== 1 ? 'en' : ''}</span>

              {isBeheerder && (
                <>
                  {bewerkPelotoon?.id === peloton.id ? (
                    <>
                      <button onClick={handlePelotoonOpslaan} className="p-1.5 rounded text-green-600 hover:bg-green-50"><Check size={14} /></button>
                      <button onClick={() => setBewerkPelotoon(null)} className="p-1.5 rounded text-army-400 hover:bg-army-50"><X size={14} /></button>
                    </>
                  ) : (
                    <button onClick={() => setBewerkPelotoon({ id: peloton.id, naam: peloton.naam })} className="p-1.5 rounded text-army-400 hover:text-army-700 hover:bg-army-50"><Pencil size={14} /></button>
                  )}
                  {verwijderPelotoon === peloton.id ? (
                    <>
                      <button onClick={() => handlePelotoonVerwijderen(peloton.id)} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"><Check size={14} /></button>
                      <button onClick={() => setVerwijderPelotoon(null)} className="p-1.5 rounded text-army-400 hover:bg-army-50"><X size={14} /></button>
                    </>
                  ) : (
                    <button onClick={() => setVerwijderPelotoon(peloton.id)} className="p-1.5 rounded text-army-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>

            {/* Groepen */}
            {isOpen && (
              <div className="border-t border-army-100 px-4 py-3 space-y-2 bg-army-50/40">
                {groepenVanPeloton.map(groep => (
                  <div key={groep.id} className="flex items-center gap-2 bg-white rounded-lg border border-army-100 px-3 py-2">
                    {bewerkGroep?.id === groep.id ? (
                      <input
                        type="text"
                        value={bewerkGroep.naam}
                        onChange={e => setBewerkGroep(g => g && ({ ...g, naam: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleGroepOpslaan()}
                        className={INPUT + ' flex-1 text-sm py-1'}
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-sm text-army-800">{groep.naam}</span>
                    )}

                    {bewerkGroep?.id === groep.id ? (
                      <>
                        <button onClick={handleGroepOpslaan} className="p-1 rounded text-green-600 hover:bg-green-50"><Check size={13} /></button>
                        <button onClick={() => setBewerkGroep(null)} className="p-1 rounded text-army-400 hover:bg-army-50"><X size={13} /></button>
                      </>
                    ) : (
                      <button onClick={() => setBewerkGroep({ id: groep.id, naam: groep.naam })} className="p-1 rounded text-army-400 hover:text-army-700 hover:bg-army-50"><Pencil size={13} /></button>
                    )}
                    {verwijderGroep === groep.id ? (
                      <>
                        <button onClick={() => handleGroepVerwijderen(groep.id)} className="p-1 rounded bg-red-600 text-white hover:bg-red-700"><Check size={13} /></button>
                        <button onClick={() => setVerwijderGroep(null)} className="p-1 rounded text-army-400 hover:bg-army-50"><X size={13} /></button>
                      </>
                    ) : (
                      <button onClick={() => setVerwijderGroep(groep.id)} className="p-1 rounded text-army-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}

                {groepError[peloton.id] && (
                  <p className="text-xs text-red-600">{groepError[peloton.id]}</p>
                )}

                {/* Nieuwe groep */}
                {nieuwGroepPelotoonId === peloton.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nieuwGroepNaam}
                      onChange={e => setNieuwGroepNaam(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGroepToevoegen(peloton.id)}
                      placeholder={`Naam ${naamGroep.toLowerCase()}…`}
                      className={INPUT + ' flex-1 text-sm py-1.5'}
                      autoFocus
                    />
                    <button onClick={() => handleGroepToevoegen(peloton.id)} className="px-3 py-1.5 rounded-lg bg-army-700 text-white text-xs font-medium hover:bg-army-800">
                      <Check size={13} />
                    </button>
                    <button onClick={() => { setNieuwGroepPelotoonId(null); setNieuwGroepNaam('') }} className="px-2 py-1.5 rounded-lg border border-army-200 text-army-500 text-xs hover:bg-army-50">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNieuwGroepPelotoonId(peloton.id); setNieuwGroepNaam('') }}
                    className="flex items-center gap-1.5 text-xs text-army-500 hover:text-army-800 py-1"
                  >
                    <Plus size={13} /> {naamGroep} toevoegen
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Nieuw peloton — alleen beheerder */}
      {isBeheerder && (
        <div className="flex gap-2">
          <input
            type="text"
            value={nieuwPelotoonNaam}
            onChange={e => setNieuwPelotoonNaam(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePelotoonToevoegen()}
            placeholder={`Naam ${naamPeloton.toLowerCase()}…`}
            className={INPUT + ' flex-1'}
          />
          <button
            onClick={handlePelotoonToevoegen}
            disabled={!nieuwPelotoonNaam.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-army-700 text-white text-sm font-medium hover:bg-army-800 disabled:opacity-40 transition-colors"
          >
            <Plus size={15} /> {naamPeloton}
          </button>
        </div>
      )}

      {zichtbarePelotonen.length === 0 && (
        <div className="text-center py-10 text-army-400 text-sm bg-white rounded-xl border border-army-100">
          Geen {naamPeloton.toLowerCase()}en gevonden.
        </div>
      )}
    </div>
  )
}
