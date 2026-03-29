import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PinInput } from '../components/PinInput'
import { Camera, CheckCircle2, AlertCircle, Loader2, Trash2, X } from 'lucide-react'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

type Sectie = 'gegevens' | 'pin' | 'verwijderen'

function Melding({ type, tekst, onClose }: { type: 'ok' | 'fout'; tekst: string; onClose?: () => void }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {type === 'ok' ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
      <span className="flex-1">{tekst}</span>
      {onClose && <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100"><X size={14} /></button>}
    </div>
  )
}

export function ProfielPage() {
  const { currentUser, updateProfiel, updateProfielPin, uploadProfielFoto, verwijderEigenAccount } = useAuth()
  const navigate = useNavigate()
  const fotoRef = useRef<HTMLInputElement>(null)

  // Gegevens
  const [naam, setNaam] = useState(currentUser?.naam ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [pinGegevens, setPinGegevens] = useState('')
  const [gegevensMelding, setGegevensMelding] = useState<{ type: 'ok' | 'fout'; tekst: string } | null>(null)
  const [gegevensLaden, setGegevensLaden] = useState(false)

  // PIN wijzigen
  const [huidigPin, setHuidigPin] = useState('')
  const [nieuwPin, setNieuwPin] = useState('')
  const [bevestigPin, setBevestigPin] = useState('')
  const [pinMelding, setPinMelding] = useState<{ type: 'ok' | 'fout'; tekst: string } | null>(null)
  const [pinLaden, setPinLaden] = useState(false)

  // Foto
  const [fotoLaden, setFotoLaden] = useState(false)
  const [fotoMelding, setFotoMelding] = useState<{ type: 'ok' | 'fout'; tekst: string } | null>(null)

  // Account verwijderen
  const [verwijderPin, setVerwijderPin] = useState('')
  const [verwijderMelding, setVerwijderMelding] = useState<{ type: 'ok' | 'fout'; tekst: string } | null>(null)
  const [verwijderLaden, setVerwijderLaden] = useState(false)
  const [verwijderBevestig, setVerwijderBevestig] = useState(false)

  const [actieveSectie, setActieveSectie] = useState<Sectie>('gegevens')

  useEffect(() => {
    setNaam(currentUser?.naam ?? '')
    setEmail(currentUser?.email ?? '')
  }, [currentUser])

  const initials = currentUser?.naam
    .split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoLaden(true)
    setFotoMelding(null)
    const result = await uploadProfielFoto(file)
    setFotoMelding(result.ok
      ? { type: 'ok', tekst: 'Profielfoto bijgewerkt.' }
      : { type: 'fout', tekst: result.error ?? 'Upload mislukt.' })
    setFotoLaden(false)
    if (fotoRef.current) fotoRef.current.value = ''
  }

  const handleGegevensOpslaan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!naam.trim() || !email.trim() || pinGegevens.length !== 4) return
    setGegevensLaden(true)
    setGegevensMelding(null)
    const result = await updateProfiel(naam, email, pinGegevens)
    setGegevensMelding(result.ok
      ? { type: 'ok', tekst: 'Gegevens opgeslagen.' }
      : { type: 'fout', tekst: result.error ?? 'Opslaan mislukt.' })
    if (result.ok) setPinGegevens('')
    setGegevensLaden(false)
  }

  const handlePinWijzigen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nieuwPin !== bevestigPin) { setPinMelding({ type: 'fout', tekst: 'Nieuwe pincodes komen niet overeen.' }); return }
    setPinLaden(true)
    setPinMelding(null)
    const result = await updateProfielPin(huidigPin, nieuwPin)
    setPinMelding(result.ok
      ? { type: 'ok', tekst: 'Pincode gewijzigd.' }
      : { type: 'fout', tekst: result.error ?? 'Wijzigen mislukt.' })
    if (result.ok) { setHuidigPin(''); setNieuwPin(''); setBevestigPin('') }
    setPinLaden(false)
  }

  const handleVerwijderen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verwijderPin.length !== 4) return
    setVerwijderLaden(true)
    setVerwijderMelding(null)
    const result = await verwijderEigenAccount(verwijderPin)
    if (!result.ok) {
      setVerwijderMelding({ type: 'fout', tekst: result.error ?? 'Verwijderen mislukt.' })
      setVerwijderLaden(false)
      return
    }
    navigate('/login')
  }

  const tabs: { key: Sectie; label: string }[] = [
    { key: 'gegevens', label: 'Persoonlijke gegevens' },
    { key: 'pin', label: 'Pincode wijzigen' },
    { key: 'verwijderen', label: 'Account verwijderen' },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-army-900">Mijn profiel</h1>

      {/* Avatar + foto upload */}
      <div className="bg-white rounded-2xl border border-army-100 shadow-sm p-6 flex flex-col items-center gap-4">
        <div className="relative">
          {currentUser?.profielFoto ? (
            <img
              src={currentUser.profielFoto}
              alt="Profielfoto"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-army-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-army-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-army-100">
              {initials}
            </div>
          )}
          <button
            onClick={() => fotoRef.current?.click()}
            disabled={fotoLaden}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-army-700 text-white flex items-center justify-center hover:bg-army-800 transition-colors shadow"
            title="Foto wijzigen"
          >
            {fotoLaden ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </button>
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
        </div>
        <div className="text-center">
          <div className="font-semibold text-army-900">{currentUser?.naam}</div>
          <div className="text-army-400 text-sm">{currentUser?.email}</div>
        </div>
        {fotoMelding && (
          <div className="w-full">
            <Melding {...fotoMelding} onClose={() => setFotoMelding(null)} />
          </div>
        )}
        <p className="text-army-400 text-xs text-center">Klik op het camera-icoon om een nieuwe foto te uploaden. Max. 5 MB — JPEG, PNG, GIF, WebP of SVG.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-army-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-army-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActieveSectie(t.key)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                actieveSectie === t.key
                  ? 'text-army-800 border-b-2 border-army-600 bg-army-50'
                  : t.key === 'verwijderen'
                    ? 'text-red-400 hover:text-red-600'
                    : 'text-army-400 hover:text-army-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* Gegevens */}
          {actieveSectie === 'gegevens' && (
            <form onSubmit={handleGegevensOpslaan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-army-600 mb-1">Naam</label>
                <input type="text" value={naam} onChange={e => setNaam(e.target.value)} className={INPUT} maxLength={100} />
              </div>
              <div>
                <label className="block text-xs font-medium text-army-600 mb-1">E-mailadres</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} maxLength={255} />
              </div>
              <div>
                <label className="block text-xs font-medium text-army-600 mb-2 text-center">Bevestig met huidige pincode</label>
                <PinInput value={pinGegevens} onChange={setPinGegevens} disabled={gegevensLaden} />
              </div>
              {gegevensMelding && <Melding {...gegevensMelding} onClose={() => setGegevensMelding(null)} />}
              <button
                type="submit"
                disabled={gegevensLaden || !naam.trim() || !email.trim() || pinGegevens.length !== 4}
                className="w-full py-2.5 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {gegevensLaden && <Loader2 size={14} className="animate-spin" />}
                Wijzigingen opslaan
              </button>
            </form>
          )}

          {/* PIN wijzigen */}
          {actieveSectie === 'pin' && (
            <form onSubmit={handlePinWijzigen} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-army-600 mb-2 text-center">Huidige pincode</label>
                <PinInput value={huidigPin} onChange={setHuidigPin} disabled={pinLaden} />
              </div>
              <div>
                <label className="block text-xs font-medium text-army-600 mb-2 text-center">Nieuwe pincode</label>
                <PinInput value={nieuwPin} onChange={setNieuwPin} disabled={pinLaden} />
              </div>
              <div>
                <label className="block text-xs font-medium text-army-600 mb-2 text-center">
                  Bevestig nieuwe pincode
                  {nieuwPin.length === 4 && bevestigPin.length === 4 && nieuwPin === bevestigPin && (
                    <CheckCircle2 size={13} className="inline ml-1.5 text-green-600" />
                  )}
                </label>
                <PinInput value={bevestigPin} onChange={setBevestigPin} disabled={pinLaden} />
              </div>
              {pinMelding && <Melding {...pinMelding} onClose={() => setPinMelding(null)} />}
              <button
                type="submit"
                disabled={pinLaden || huidigPin.length !== 4 || nieuwPin.length !== 4 || bevestigPin.length !== 4}
                className="w-full py-2.5 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {pinLaden && <Loader2 size={14} className="animate-spin" />}
                Pincode wijzigen
              </button>
            </form>
          )}

          {/* Account verwijderen */}
          {actieveSectie === 'verwijderen' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <strong>Let op:</strong> dit verwijdert je account en alle gekoppelde gegevens permanent. Dit kan niet ongedaan worden gemaakt.
              </div>

              {!verwijderBevestig ? (
                <button
                  onClick={() => setVerwijderBevestig(true)}
                  className="w-full py-2.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Mijn account verwijderen
                </button>
              ) : (
                <form onSubmit={handleVerwijderen} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-army-600 mb-2 text-center">Bevestig met je pincode</label>
                    <PinInput value={verwijderPin} onChange={setVerwijderPin} disabled={verwijderLaden} />
                  </div>
                  {verwijderMelding && <Melding {...verwijderMelding} onClose={() => setVerwijderMelding(null)} />}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setVerwijderBevestig(false); setVerwijderPin('') }}
                      className="flex-1 py-2.5 rounded-lg border border-army-200 text-army-600 text-sm font-medium hover:bg-army-50 transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      disabled={verwijderLaden || verwijderPin.length !== 4}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                    >
                      {verwijderLaden && <Loader2 size={14} className="animate-spin" />}
                      Definitief verwijderen
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
