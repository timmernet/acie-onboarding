import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PinInput } from '../components/PinInput'
import { AlertCircle, CheckCircle2, ChevronLeft, Clock } from 'lucide-react'

const INPUT = 'w-full px-4 py-2.5 rounded-lg border border-army-300 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm bg-white'

export function RegisterPage() {
  const { register, appConfig, pelotonen, groepen } = useAuth()
  const logo = appConfig?.logoUrl || '/Embleem_13_Lichte_Brigade.png'
  const naamPeloton = appConfig?.naamPeloton || 'Peloton'
  const naamGroep = appConfig?.naamGroep || 'Groep'

  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [pelotoonId, setPelotoonId] = useState('')
  const [groepId, setGroepId] = useState('')
  const [pin, setPin] = useState('')
  const [pinBevestig, setPinBevestig] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [geregistreerd, setGeregistreerd] = useState(false)

  const pinMatch = pin.length === 4 && pinBevestig.length === 4 && pin === pinBevestig
  const groepenVoorPeloton = groepen.filter(g => g.pelotoonId === pelotoonId)

  const handlePelotoonChange = (id: string) => {
    setPelotoonId(id)
    setGroepId('') // reset groep bij ander peloton
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pin.length < 4) { setError('Kies een 4-cijferige pincode.'); return }
    if (pin !== pinBevestig) { setError('Pincodes komen niet overeen.'); return }
    if (!pelotoonId) { setError(`Selecteer je ${naamPeloton.toLowerCase()}.`); return }
    setLoading(true)
    const result = await register(naam, email, pin, pelotoonId, groepId || undefined)
    setLoading(false)
    if (result.ok) setGeregistreerd(true)
    else setError(result.error ?? 'Registratie mislukt.')
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
        <img src={logo} alt="Logo" className="h-20 w-auto mb-4 drop-shadow-lg" />
        <h1 className="text-white text-2xl font-extrabold">Account aanmaken</h1>
        <p className="text-army-300 text-sm mt-1">{appConfig?.eenheidSubtitel || '30IBB · 13 Lichte Brigade'}</p>
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
              <label className="block text-sm font-medium text-army-700 mb-1.5">Volledige naam</label>
              <input type="text" required value={naam} onChange={e => setNaam(e.target.value)} placeholder="Voornaam Achternaam" className={INPUT} />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-1.5">E-mailadres</label>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="naam@voorbeeld.nl" className={INPUT} />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-1.5">{naamPeloton}</label>
              <select required value={pelotoonId} onChange={e => handlePelotoonChange(e.target.value)} className={INPUT}>
                <option value="">Selecteer {naamPeloton.toLowerCase()}…</option>
                {pelotonen.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
              </select>
            </div>

            {pelotoonId && groepenVoorPeloton.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-army-700 mb-1.5">{naamGroep} <span className="text-army-400 font-normal">(optioneel)</span></label>
                <select value={groepId} onChange={e => setGroepId(e.target.value)} className={INPUT}>
                  <option value="">Selecteer {naamGroep.toLowerCase()}…</option>
                  {groepenVoorPeloton.map(g => <option key={g.id} value={g.id}>{g.naam}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-army-700 mb-3 text-center">Kies een pincode</label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                Bevestig pincode
                {pinMatch && <CheckCircle2 size={14} className="inline ml-1.5 text-green-600" />}
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
