import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PinInput } from '../components/PinInput'
import { AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login, appConfig } = useAuth()
  const logo = appConfig?.logoUrl || '/Embleem_13_Lichte_Brigade.png'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async (currentPin: string) => {
    setError('')
    setLoading(true)
    const { result, pogingenOver, geblokkerdTot } = await login(email, currentPin)
    setLoading(false)
    if (result === 'ok') {
      navigate('/')
    } else if (result === 'wacht') {
      setError('Je account wacht op activatie door een commandant of beheerder.')
      setPin('')
    } else if (result === 'geblokkeerd') {
      const tijdStr = geblokkerdTot
        ? new Date(geblokkerdTot).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        : ''
      setError(`Account tijdelijk geblokkeerd na te veel mislukte pogingen. Probeer het opnieuw om ${tijdStr}.`)
      setPin('')
    } else {
      const extra = pogingenOver !== undefined && pogingenOver <= 2
        ? ` Nog ${pogingenOver} poging${pogingenOver === 1 ? '' : 'en'} voor tijdelijke blokkering.`
        : ''
      setError(`E-mailadres of pincode is onjuist.${extra}`)
      setPin('')
    }
  }

  useEffect(() => {
    if (pin.length === 4 && email.trim()) {
      doLogin(pin)
    }
  }, [pin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) {
      setError('Voer een 4-cijferige pincode in.')
      return
    }
    doLogin(pin)
  }

  return (
    <div className="min-h-screen bg-army-800 flex flex-col">
      {/* Hero header */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-4 text-center">
        <img src={logo} alt="Logo" className="h-24 w-auto mb-5 drop-shadow-lg" />
        <h1 className="text-white text-3xl font-extrabold tracking-tight">{appConfig?.eenheidNaam || 'A-Compagnie'}</h1>
        <p className="text-army-300 text-sm mt-1">{appConfig?.eenheidSubtitel || '30e Infanteriebataljon · 13 Lichte Brigade'}</p>
        <p className="text-army-400 text-xs mt-3">{appConfig?.appNaam || 'Reservisten Onboarding Portaal'}</p>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-army-900 font-bold text-xl mb-6 text-center">Inloggen</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-medium text-army-700 mb-3 text-center">
                Pincode
              </label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-army-700 hover:bg-army-800 disabled:bg-army-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Bezig met inloggen…' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <Link
              to="/vergeten"
              className="text-army-500 hover:text-army-700 text-sm transition-colors"
            >
              Pincode vergeten?
            </Link>
            <div className="text-army-400 text-xs">·</div>
            <p className="text-sm text-gray-500">
              Nog geen account?{' '}
              <Link
                to="/registreer"
                className="text-army-600 font-semibold hover:text-army-800 transition-colors"
              >
                Registreer je hier
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-army-50 rounded-lg border border-army-100">
            <p className="text-army-600 text-xs font-medium mb-1">Demo accounts:</p>
            <div className="text-army-500 text-xs space-y-0.5">
              <div>admin@mindef.nl · <span className="font-mono">0000</span></div>
              <div>t.smit@mindef.nl · <span className="font-mono">1111</span></div>
              <div>l.hendriksen@reservist.nl · <span className="font-mono">2222</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="py-8" />
    </div>
  )
}
