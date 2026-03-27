import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PinInput } from '../components/PinInput'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function PinResetPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [pin, setPin] = useState('')
  const [pinBevestig, setPinBevestig] = useState('')
  const [status, setStatus] = useState<'invoeren' | 'opgeslagen' | 'fout'>('invoeren')
  const [foutmelding, setFoutmelding] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('fout')
      setFoutmelding('Geen geldig resettoken gevonden in de link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) return
    if (pin !== pinBevestig) { setFoutmelding('Pincodes komen niet overeen.'); return }
    setFoutmelding('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/pin-reset/toepassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFoutmelding(data.error === 'Link is verlopen'
          ? 'Deze resetlink is verlopen. Vraag een nieuwe aan.'
          : data.error ?? 'Ongeldige of al gebruikte resetlink.')
        setLoading(false)
        return
      }
      setStatus('opgeslagen')
    } catch {
      setFoutmelding('Er is een fout opgetreden. Probeer het opnieuw.')
    }
    setLoading(false)
  }

  const pinMatch = pin.length === 4 && pinBevestig.length === 4 && pin === pinBevestig

  return (
    <div className="min-h-screen bg-army-800 flex flex-col">
      <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4 text-center">
        <img src="/Embleem_13_Lichte_Brigade.png" alt="13 Lichte Brigade" className="h-20 w-auto mb-4 drop-shadow-lg" />
        <h1 className="text-white text-2xl font-extrabold">Nieuwe pincode instellen</h1>
        <p className="text-army-300 text-sm mt-1">30IBB · 13 Lichte Brigade</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">

          {status === 'opgeslagen' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-army-900 text-lg">Pincode opgeslagen</h3>
              <p className="text-gray-500 text-sm">Je nieuwe pincode is ingesteld. Je kunt nu inloggen.</p>
              <Link
                to="/login"
                className="block w-full bg-army-700 hover:bg-army-800 text-white font-semibold py-3 rounded-lg transition-colors text-sm text-center"
              >
                Naar inloggen
              </Link>
            </div>
          )}

          {status === 'fout' && (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="font-bold text-army-900 text-lg">Link ongeldig</h3>
              <p className="text-gray-500 text-sm">{foutmelding}</p>
              <Link
                to="/vergeten"
                className="block w-full bg-army-700 hover:bg-army-800 text-white font-semibold py-3 rounded-lg transition-colors text-sm text-center"
              >
                Nieuwe resetlink aanvragen
              </Link>
            </div>
          )}

          {status === 'invoeren' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-gray-600 text-sm">Kies een nieuwe 4-cijferige pincode.</p>

              <div>
                <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                  Nieuwe pincode
                </label>
                <PinInput value={pin} onChange={setPin} disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                  Bevestig pincode
                  {pinMatch && <CheckCircle2 size={14} className="inline ml-1.5 text-green-600" />}
                </label>
                <PinInput value={pinBevestig} onChange={setPinBevestig} disabled={loading} />
              </div>

              {foutmelding && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {foutmelding}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !pinMatch}
                className="w-full bg-army-700 hover:bg-army-800 disabled:bg-army-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Opslaan…' : 'Pincode opslaan'}
              </button>
            </form>
          )}

        </div>
      </div>
      <div className="py-8" />
    </div>
  )
}
