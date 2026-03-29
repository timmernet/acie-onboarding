import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function ForgotPinPage() {
  const { appConfig } = useAuth()
  const logo = appConfig?.logoUrl || '/Embleem_13_Lichte_Brigade.png'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/pin-reset/aanvragen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // stil falen — toon altijd het succes-scherm
    }
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-army-800 flex flex-col">
      <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4 text-center">
        <img src={logo} alt="Logo" className="h-20 w-auto mb-4 drop-shadow-lg" />
        <h1 className="text-white text-2xl font-extrabold">Pincode vergeten</h1>
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

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-army-900 text-lg mb-2">E-mail verstuurd</h3>
              <p className="text-gray-500 text-sm">
                Als er een account bestaat voor <strong>{email}</strong>, ontvang je een e-mail met een link om je pincode opnieuw in te stellen.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block text-army-600 font-semibold text-sm hover:text-army-800 transition-colors"
              >
                Terug naar inloggen
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-5">
                Voer je e-mailadres in. Je ontvangt een link om een nieuwe pincode in te stellen.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-army-700 mb-1.5">
                    E-mailadres
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-army-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="naam@voorbeeld.nl"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-army-300 focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-army-700 hover:bg-army-800 disabled:bg-army-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Versturen…' : 'Herstelmail versturen'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="py-8" />
    </div>
  )
}
