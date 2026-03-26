import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, User, Lock } from 'lucide-react'

const CATEGORIE_KLEUREN: Record<string, string> = {
  Administratie: 'bg-blue-100 text-blue-700',
  IT: 'bg-purple-100 text-purple-700',
  Medisch: 'bg-red-100 text-red-700',
  Materieel: 'bg-amber-100 text-amber-700',
}

export function ReservistDashboard() {
  const { currentUser, toggleTask, setOpmerking, taken } = useAuth()
  const [openTask, setOpenTask] = useState<string | null>(null)

  if (!currentUser) return null

  const voltooid = currentUser.taken.filter(t => t.voltooid).length
  const totaal = taken.length
  const pct = totaal > 0 ? Math.round((voltooid / totaal) * 100) : 0

  const getStatus = (taskId: string) =>
    currentUser.taken.find(t => t.taskId === taskId)

  const isGeblokkeerd = (vereistTaakId?: string) =>
    !!vereistTaakId && !getStatus(vereistTaakId)?.voltooid

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-army-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-army-600 flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <div className="font-bold">{currentUser.naam}</div>
            <div className="text-army-300 text-sm">{currentUser.pelotoon}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-extrabold text-gold-400">{pct}%</div>
            <div className="text-army-300 text-xs">{voltooid}/{totaal} taken</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-army-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gold-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {pct === 100 && (
          <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle2 size={16} />
            Alle taken voltooid — welkom bij de eenheid!
          </div>
        )}
      </div>

      {/* Task list */}
      <div>
        <h2 className="text-army-900 font-bold text-lg mb-3">Onboarding taken</h2>
        <div className="space-y-2">
          {taken.map((taak, index) => {
            const status = getStatus(taak.id)
            const voltooidItem = status?.voltooid ?? false
            const geblokkeerd = isGeblokkeerd(taak.vereistTaakId)
            const vereisteTaak = taak.vereistTaakId ? taken.find(t => t.id === taak.vereistTaakId) : null
            const isOpen = openTask === taak.id

            return (
              <div
                key={taak.id}
                className={`bg-white rounded-xl border transition-all shadow-sm overflow-hidden ${
                  voltooidItem ? 'border-green-200' : geblokkeerd ? 'border-gray-200 opacity-60' : 'border-army-100'
                }`}
              >
                {/* Task header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setOpenTask(isOpen ? null : taak.id)}
                >
                  {/* Volgnummer */}
                  <span className="text-xs font-bold text-army-400 w-5 text-center flex-shrink-0">
                    {index + 1}
                  </span>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (!geblokkeerd) toggleTask(taak.id)
                    }}
                    disabled={geblokkeerd}
                    className={`flex-shrink-0 transition-transform ${geblokkeerd ? 'cursor-not-allowed' : 'hover:scale-110'}`}
                  >
                    {geblokkeerd ? (
                      <Lock size={22} className="text-gray-300" />
                    ) : voltooidItem ? (
                      <CheckCircle2 size={24} className="text-green-500" />
                    ) : (
                      <Circle size={24} className="text-army-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${voltooidItem ? 'line-through text-gray-400' : geblokkeerd ? 'text-gray-400' : 'text-army-900'}`}>
                      {taak.titel}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIE_KLEUREN[taak.categorie] ?? 'bg-gray-100 text-gray-600'}`}>
                        {taak.categorie}
                      </span>
                      {geblokkeerd && vereisteTaak && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Lock size={10} /> Eerst: {vereisteTaak.titel}
                        </span>
                      )}
                      {voltooidItem && status?.voltooiDatum && (
                        <span className="text-xs text-green-600">
                          ✓ {new Date(status.voltooiDatum).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-army-400 flex-shrink-0">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                    {geblokkeerd && vereisteTaak && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Lock size={14} className="flex-shrink-0" />
                        Beschikbaar nadat <span className="font-semibold mx-1">"{vereisteTaak.titel}"</span> is afgerond.
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-3 mb-3">{taak.beschrijving}</p>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-army-600 mb-1.5">Opmerking</label>
                      <textarea
                        rows={2}
                        placeholder="Voeg een persoonlijke opmerking toe…"
                        defaultValue={status?.opmerking ?? ''}
                        onBlur={e => setOpmerking(taak.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-army-200 bg-army-50 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>
                    {!geblokkeerd && (
                      <button
                        onClick={() => toggleTask(taak.id)}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                          voltooidItem
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-army-700 text-white hover:bg-army-800'
                        }`}
                      >
                        {voltooidItem ? 'Markeer als openstaand' : 'Markeer als voltooid'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
