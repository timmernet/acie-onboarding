import { useEffect, useState, useCallback } from 'react'
import { Shield, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface AuditEntry {
  id: string
  tijdstip: string
  userId: string | null
  userNaam: string
  userRol: string
  actie: string
  entiteit: string | null
  entiteitId: string | null
  details: Record<string, unknown>
  ipAdres: string | null
}

interface AuditResponse {
  logs: AuditEntry[]
  totaal: number
  pagina: number
  perPagina: number
  paginas: number
}

const ACTIE_KLEUREN: Record<string, string> = {
  LOGIN_OK: 'bg-green-100 text-green-800',
  LOGIN_FOUT: 'bg-red-100 text-red-800',
  ACCOUNT_GEBLOKKEERD: 'bg-red-200 text-red-900',
  LOGOUT: 'bg-gray-100 text-gray-700',
  REGISTRATIE: 'bg-blue-100 text-blue-800',
  PIN_RESET_AANGEVRAAGD: 'bg-yellow-100 text-yellow-800',
  PIN_RESET_UITGEVOERD: 'bg-yellow-200 text-yellow-900',
  USER_AANGEMAAKT: 'bg-blue-100 text-blue-800',
  USER_BIJGEWERKT: 'bg-indigo-100 text-indigo-800',
  USER_VERWIJDERD: 'bg-red-100 text-red-800',
  USER_GEACTIVEERD: 'bg-green-100 text-green-800',
  USER_GEDEACTIVEERD: 'bg-orange-100 text-orange-800',
  USER_AFGEWEZEN: 'bg-red-100 text-red-800',
  TAAK_AANGEMAAKT: 'bg-blue-100 text-blue-800',
  TAAK_BIJGEWERKT: 'bg-indigo-100 text-indigo-800',
  TAAK_VERWIJDERD: 'bg-red-100 text-red-800',
  TAAK_VOLTOOID: 'bg-green-100 text-green-800',
  TAAK_HEROPEND: 'bg-orange-100 text-orange-800',
  PELOTON_AANGEMAAKT: 'bg-blue-100 text-blue-800',
  PELOTON_BIJGEWERKT: 'bg-indigo-100 text-indigo-800',
  PELOTON_VERWIJDERD: 'bg-red-100 text-red-800',
  GROEP_AANGEMAAKT: 'bg-blue-100 text-blue-800',
  GROEP_BIJGEWERKT: 'bg-indigo-100 text-indigo-800',
  GROEP_VERWIJDERD: 'bg-red-100 text-red-800',
  BESTAND_GEUPLOAD: 'bg-purple-100 text-purple-800',
  BESTAND_VERWIJDERD: 'bg-red-100 text-red-800',
  CONFIG_THEMA: 'bg-teal-100 text-teal-800',
  CONFIG_EMAIL: 'bg-teal-100 text-teal-800',
}

function formatTijdstip(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'medium' })
}

function formatDetails(details: Record<string, unknown>) {
  if (!details || Object.keys(details).length === 0) return '—'
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')
}

export default function AuditLogPanel() {
  const { appConfig } = useAuth()

  const rolLabels: Record<string, string> = {
    reservist:        appConfig?.naamReservist        || 'Reservist',
    groepscommandant: appConfig?.naamGroepscommandant || 'Groepscommandant',
    commandant:       appConfig?.naamCommandant       || 'Pelotonscommandant',
    beheerder:        'Beheerder',
    anoniem:          'Anoniem',
    onbekend:         'Onbekend',
  }

  const [data, setData] = useState<AuditResponse | null>(null)
  const [pagina, setPagina] = useState(1)
  const [zoekActie, setZoekActie] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  const laadLogs = useCallback(async () => {
    setLaden(true)
    setFout('')
    try {
      const params = new URLSearchParams({ page: String(pagina), perPage: '50' })
      if (zoekActie.trim()) params.set('actie', zoekActie.trim().toUpperCase())
      const resp = await fetch(`/api/audit?${params}`, { credentials: 'include' })
      if (!resp.ok) throw new Error('Laden mislukt')
      setData(await resp.json())
    } catch {
      setFout('Auditlog laden mislukt.')
    } finally {
      setLaden(false)
    }
  }, [pagina, zoekActie])

  useEffect(() => { laadLogs() }, [laadLogs])

  function handleZoek(e: React.FormEvent) {
    e.preventDefault()
    setPagina(1)
    laadLogs()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-army-600" />
          <h2 className="text-lg font-semibold text-gray-900">Auditlog</h2>
          {data && <span className="text-sm text-gray-500">({data.totaal} vermeldingen)</span>}
        </div>
        <button onClick={laadLogs} className="p-2 text-gray-500 hover:text-army-600 rounded" title="Vernieuwen">
          <RefreshCw className={`w-4 h-4 ${laden ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleZoek} className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={zoekActie}
            onChange={e => setZoekActie(e.target.value)}
            placeholder="Filter op actie (bijv. LOGIN_OK)"
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-army-500"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-army-600 text-white rounded-lg text-sm hover:bg-army-700">
          Zoeken
        </button>
        {zoekActie && (
          <button type="button" onClick={() => { setZoekActie(''); setPagina(1) }} className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Wissen
          </button>
        )}
      </form>

      {fout && <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{fout}</div>}

      {laden && !data && (
        <div className="text-center py-12 text-gray-400 text-sm">Laden…</div>
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Tijdstip</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Actie</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Gebruiker</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Entiteit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">IP-adres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Geen vermeldingen gevonden.</td>
                  </tr>
                )}
                {data.logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {formatTijdstip(log.tijdstip)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTIE_KLEUREN[log.actie] ?? 'bg-gray-100 text-gray-700'}`}>
                        {log.actie}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-gray-800">{log.userNaam}</span>
                      <span className="ml-1 text-xs text-gray-400">({rolLabels[log.userRol] ?? log.userRol})</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                      {log.entiteit ? `${log.entiteit}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {formatDetails(log.details)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                      {log.ipAdres ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.paginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                Pagina {data.pagina} van {data.paginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagina(p => Math.min(data.paginas, p + 1))}
                  disabled={pagina >= data.paginas}
                  className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
