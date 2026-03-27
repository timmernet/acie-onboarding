import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PinInput } from '../components/PinInput'
import { AlertCircle, CheckCircle2, ChevronLeft, Clock } from 'lucide-react'
import { PELOTONEN } from '../data/dummyData'

export function RegisterPage() {
  const { register } = useAuth()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [pelotoon, setPelotoon] = useState('')
  const [pin, setPin] = useState('')
  const [pinBevestig, setPinBevestig] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [geregistreerd, setGeregistreerd] = useState(false)

  const pinMatch = pin.length === 4 && pinBevestig.length === 4 && pin === pinBevestig

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length < 4) { setError('Kies een 4-cijferige pincode.'); return }
    if (pin !== pinBevestig) { setError('Pincodes komen niet overeen.'); return }
    if (!pelotoon) { setError('Selecteer je peloton.'); return }
    setLoading(true)
    setTimeout(() => {
      const result = register(naam, email, pin, pelotoon)
      setLoading(false)
      if (result.ok) setGeregistreerd(true)
      else setError(result.error ?? 'Registratie mislukt.')
    }, 300)
  }

  if (geregistreerd) {
    return (
      <div className="min-h-screen bg-army-800 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={28} className="text-amber-600" />
            </div>
          </div>
          <h2 className="text-army-900 font-bold text-xl">Account aangevraagd</h2>
          <p className="text-army-600 text-sm">
            Je account voor <span className="font-semibold">{email}</span> is aangemaakt en wacht op activatie door een commandant of beheerder.
          </p>
          <p className="text-army-500 text-xs">Je ontvangt toegang zodra je account is goedgekeurd.</p>
          <Link
            to="/login"
            className="block w-full bg-army-700 hover:bg-army-800 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-army-800 flex flex-col">
      <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4 text-center">
        <img src="/Embleem_13_Lichte_Brigade.png" alt="13 Lichte Brigade" className="h-20 w-auto mb-4 drop-shadow-lg" />
        <h1 className="text-white text-2xl font-extrabold">Account aanmaken</h1>
        <p className="text-army-300 text-sm mt-1">30IBB · 13 Lichte Brigade</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <Link
            to="/login"
            className="flex items-center gap-1 text-army-500 hover:text-army-700 text-sm mb-5 transition-colors"
          >
            <ChevronLeft size={16} /> Terug naar inloggen
          </Link>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-army-700 mb-1.5">
                Volledige naam
              </label>
              <input
                type="text"
                required
                value={naam}
                onChange={e => setNaam(e.target.value)}
                placeholder="Voornaam Achternaam"
                className="w-full px-4 py-2.5 rounded-lg border border-army-300 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-1.5">
                E-mailadres
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                className="w-full px-4 py-2.5 rounded-lg border border-army-300 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-1.5">
                Peloton
              </label>
              <select
                required
                value={pelotoon}
                onChange={e => setPelotoon(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-army-300 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Selecteer peloton…</option>
                {PELOTONEN.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                Kies een pincode
              </label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                Bevestig pincode
                {pinMatch && (
                  <CheckCircle2 size={14} className="inline ml-1.5 text-green-600" />
                )}
              </label>
              <PinInput value={pinBevestig} onChange={setPinBevestig} disabled={loading} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4 || !pinMatch}
              className="w-full bg-army-700 hover:bg-army-800 disabled:bg-army-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Bezig…' : 'Account aanmaken'}
            </button>
          </form>
        </div>
      </div>
      <div className="py-8" />
    </div>
  )
}
