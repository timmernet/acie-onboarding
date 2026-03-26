import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Users } from 'lucide-react'

export function CommanderDashboard() {
  const { users, taken } = useAuth()
  const [openUser, setOpenUser] = useState<string | null>(null)
  const [filterPelotoon, setFilterPelotoon] = useState('Alle')

  const reservisten = users.filter(u => u.rol === 'reservist')

  const pelotonen = ['Alle', ...Array.from(new Set(reservisten.map(u => u.pelotoon))).sort()]

  const gefilterd = filterPelotoon === 'Alle'
    ? reservisten
    : reservisten.filter(u => u.pelotoon === filterPelotoon)

  const pct = (user: typeof reservisten[0]) => {
    const v = user.taken.filter(t => t.voltooid).length
    return Math.round((v / taken.length) * 100)
  }

  const gemiddeld = gefilterd.length
    ? Math.round(gefilterd.reduce((sum, u) => sum + pct(u), 0) / gefilterd.length)
    : 0

  const volledigKlaar = gefilterd.filter(u => pct(u) === 100).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-army-800 text-white rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-gold-400">{gefilterd.length}</div>
          <div className="text-army-300 text-xs mt-1">Reservisten</div>
        </div>
        <div className="bg-army-800 text-white rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-gold-400">{gemiddeld}%</div>
          <div className="text-army-300 text-xs mt-1">Gem. voortgang</div>
        </div>
        <div className="bg-army-800 text-white rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-green-400">{volledigKlaar}</div>
          <div className="text-army-300 text-xs mt-1">Volledig klaar</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {pelotonen.map(p => (
          <button
            key={p}
            onClick={() => setFilterPelotoon(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterPelotoon === p
                ? 'bg-army-700 text-white'
                : 'bg-white text-army-600 border border-army-200 hover:border-army-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Reservist list */}
      <div>
        <h2 className="text-army-900 font-bold text-lg mb-3 flex items-center gap-2">
          <Users size={18} />
          Voortgang per reservist
        </h2>
        <div className="space-y-2">
          {gefilterd.length === 0 && (
            <div className="text-center py-10 text-army-400 text-sm bg-white rounded-xl border border-army-100">
              Geen reservisten gevonden.
            </div>
          )}
          {gefilterd.map(user => {
            const p = pct(user)
            const isOpen = openUser === user.id
            const voltooid = user.taken.filter(t => t.voltooid).length

            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-army-100 shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setOpenUser(isOpen ? null : user.id)}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    p === 100 ? 'bg-green-100 text-green-700' : 'bg-army-100 text-army-700'
                  }`}>
                    {user.naam.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-army-900 text-sm">{user.naam}</div>
                    <div className="text-army-500 text-xs">
                      {user.pelotoon}
                      {user.laatstIngelogd && (
                        <span className="ml-2 text-army-400">
                          · ingelogd {new Date(user.laatstIngelogd).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-army-100 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${p === 100 ? 'bg-green-500' : 'bg-army-600'}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="text-xs text-army-500 flex-shrink-0">{voltooid}/{taken.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${p === 100 ? 'text-green-600' : 'text-army-700'}`}>
                      {p}%
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-army-400" /> : <ChevronDown size={16} className="text-army-400" />}
                  </div>
                </div>

                {/* Expanded task list */}
                {isOpen && (
                  <div className="border-t border-army-100 px-4 py-3">
                    <div className="text-xs font-semibold text-army-500 uppercase tracking-wide mb-2">Taken</div>
                    <div className="space-y-1.5">
                      {taken.map(taak => {
                        const t = user.taken.find(ut => ut.taskId === taak.id)
                        return (
                          <div key={taak.id} className="flex items-center gap-2.5">
                            {t?.voltooid ? (
                              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle size={16} className="text-army-300 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${t?.voltooid ? 'text-gray-400 line-through' : 'text-army-800'}`}>
                              {taak.titel}
                            </span>
                            {t?.voltooiDatum && (
                              <span className="ml-auto text-xs text-green-600 flex-shrink-0">
                                {new Date(t.voltooiDatum).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
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
