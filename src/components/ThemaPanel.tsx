import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Palette, Upload, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { applyArmyTheme } from '../utils/applyTheme'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

export function ThemaPanel() {
  const { appConfig, updateThemaConfig } = useAuth()

  const [appNaam, setAppNaam] = useState('')
  const [eenheidNaam, setEenheidNaam] = useState('')
  const [eenheidSubtitel, setEenheidSubtitel] = useState('')
  const [primairKleur, setPrimairKleur] = useState('#3f7a22')
  const [logoUrl, setLogoUrl] = useState('')
  const [naamReservist, setNaamReservist] = useState('')
  const [naamGroepscommandant, setNaamGroepscommandant] = useState('')
  const [naamCommandant, setNaamCommandant] = useState('')
  const [naamPeloton, setNaamPeloton] = useState('')
  const [naamGroep, setNaamGroep] = useState('')
  const [browserTitel, setBrowserTitel] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoFout, setLogoFout] = useState('')
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [faviconFout, setFaviconFout] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [foutmelding, setFoutmelding] = useState('')

  useEffect(() => {
    if (appConfig) {
      setAppNaam(appConfig.appNaam || '')
      setEenheidNaam(appConfig.eenheidNaam || '')
      setEenheidSubtitel(appConfig.eenheidSubtitel || '')
      setPrimairKleur(appConfig.primairKleur || '#3f7a22')
      setLogoUrl(appConfig.logoUrl || '')
      setNaamReservist(appConfig.naamReservist || '')
      setNaamGroepscommandant(appConfig.naamGroepscommandant || '')
      setNaamCommandant(appConfig.naamCommandant || '')
      setNaamPeloton(appConfig.naamPeloton || '')
      setNaamGroep(appConfig.naamGroep || '')
      setBrowserTitel(appConfig.browserTitel || '')
      setFaviconUrl(appConfig.faviconUrl || '')
    }
  }, [appConfig])

  const handleKleurPreview = (hex: string) => {
    setPrimairKleur(hex)
    applyArmyTheme(hex)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoFout('Alleen afbeeldingen toegestaan')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoFout('Bestand mag maximaal 2 MB zijn')
      return
    }
    setLogoFout('')
    setLogoUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/config/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Upload mislukt')
      const data = await res.json()
      setLogoUrl(data.url)
    } catch {
      setLogoFout('Upload mislukt. Probeer opnieuw.')
    } finally {
      setLogoUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setFaviconFout('Alleen afbeeldingen toegestaan'); return }
    if (file.size > 512 * 1024) { setFaviconFout('Bestand mag maximaal 512 KB zijn'); return }
    setFaviconFout('')
    setFaviconUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/config/upload', { method: 'POST', body: formData, credentials: 'include' })
      if (!res.ok) throw new Error('Upload mislukt')
      const data = await res.json()
      setFaviconUrl(data.url)
    } catch {
      setFaviconFout('Upload mislukt. Probeer opnieuw.')
    } finally {
      setFaviconUploading(false)
      if (faviconRef.current) faviconRef.current.value = ''
    }
  }

  const handleOpslaan = async () => {
    setStatus('saving')
    setFoutmelding('')
    const result = await updateThemaConfig({
      appNaam,
      eenheidNaam,
      eenheidSubtitel,
      primairKleur,
      logoUrl,
      naamReservist,
      naamGroepscommandant,
      naamCommandant,
      naamPeloton,
      naamGroep,
      browserTitel,
      faviconUrl,
    })
    if (result.ok) {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setFoutmelding(result.error ?? 'Opslaan mislukt')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-army-500 text-sm">
        Pas de naam, kleur en het logo van de applicatie aan voor white-labeling.
      </p>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Palette size={15} /> Tekst &amp; naam
        </h3>

        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Naam applicatie</label>
          <input
            type="text"
            placeholder="Reservisten Onboarding"
            value={appNaam}
            onChange={e => setAppNaam(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Naam eenheid (groot, in header e-mail)</label>
          <input
            type="text"
            placeholder="A-Compagnie · 30e Infanteriebataljon"
            value={eenheidNaam}
            onChange={e => setEenheidNaam(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Subtitel eenheid (klein, onder naam)</label>
          <input
            type="text"
            placeholder="13 Lichte Brigade — Reservisten Onboarding"
            value={eenheidSubtitel}
            onChange={e => setEenheidSubtitel(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-army-600 mb-1">Browsertitelbalk</label>
          <input
            type="text"
            placeholder="Onboarding — A-Compagnie 30IBB"
            value={browserTitel}
            onChange={e => setBrowserTitel(e.target.value)}
            className={INPUT}
          />
          <p className="text-xs text-army-400 mt-1">De tekst die zichtbaar is in het browsertabblad.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Palette size={15} /> Naamgeving rollen &amp; eenheden
        </h3>
        <p className="text-xs text-army-500">Pas de namen van rollen en organisatorische eenheden aan voor jouw organisatie.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Naam gebruiker-rol</label>
            <input type="text" placeholder="Gebruiker" value={naamReservist} onChange={e => setNaamReservist(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Naam groepsleider-rol</label>
            <input type="text" placeholder="Groepsleider" value={naamGroepscommandant} onChange={e => setNaamGroepscommandant(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Naam manager-rol</label>
            <input type="text" placeholder="Manager" value={naamCommandant} onChange={e => setNaamCommandant(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Naam afdeling-eenheid</label>
            <input type="text" placeholder="Afdeling" value={naamPeloton} onChange={e => setNaamPeloton(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Naam groep-eenheid</label>
            <input type="text" placeholder="Groep" value={naamGroep} onChange={e => setNaamGroep(e.target.value)} className={INPUT} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Palette size={15} /> Kleur
        </h3>
        <p className="text-xs text-army-500">De primaire kleur bepaalt het gehele kleurschema van de app.</p>

        <div className="flex items-center gap-4">
          <input
            type="color"
            value={primairKleur}
            onChange={e => handleKleurPreview(e.target.value)}
            className="w-14 h-10 rounded-lg border border-army-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={primairKleur}
            onChange={e => {
              setPrimairKleur(e.target.value)
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) applyArmyTheme(e.target.value)
            }}
            className={INPUT + ' font-mono w-32'}
            placeholder="#3f7a22"
            maxLength={7}
          />
          <div
            className="flex-1 h-10 rounded-lg shadow-inner"
            style={{ background: `linear-gradient(to right, rgb(var(--army-100)), rgb(var(--army-500)), rgb(var(--army-900)))` }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['#3f7a22', '#1a5276', '#7d3c98', '#b7950b', '#922b21', '#1e8449'].map(kleur => (
            <button
              key={kleur}
              onClick={() => handleKleurPreview(kleur)}
              title={kleur}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: kleur,
                borderColor: primairKleur === kleur ? '#fff' : 'transparent',
                boxShadow: primairKleur === kleur ? `0 0 0 2px ${kleur}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Upload size={15} /> Logo
        </h3>

        {logoUrl && (
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain rounded border border-army-100 p-1 bg-army-50" />
            <button
              onClick={() => setLogoUrl('')}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X size={12} /> Verwijderen
            </button>
          </div>
        )}

        <label className="block">
          <span className="sr-only">Logo uploaden</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={logoUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-army-300 text-army-600 hover:border-army-500 hover:text-army-800 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {logoUploading ? 'Uploaden…' : logoUrl ? 'Ander logo kiezen' : 'Logo uploaden'}
          </button>
        </label>
        <p className="text-xs text-army-400">Aanbevolen: PNG of SVG, transparante achtergrond, maximaal 2 MB.</p>
        {logoFout && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {logoFout}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Upload size={15} /> Favicon (tabblad-icoon)
        </h3>

        {faviconUrl && (
          <div className="flex items-center gap-3">
            <img src={faviconUrl} alt="Favicon" className="h-8 w-8 object-contain rounded border border-army-100 p-0.5 bg-army-50" />
            <button onClick={() => setFaviconUrl('')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X size={12} /> Verwijderen
            </button>
          </div>
        )}

        <label className="block">
          <span className="sr-only">Favicon uploaden</span>
          <input ref={faviconRef} type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
          <button
            type="button"
            onClick={() => faviconRef.current?.click()}
            disabled={faviconUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-army-300 text-army-600 hover:border-army-500 hover:text-army-800 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {faviconUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {faviconUploading ? 'Uploaden…' : faviconUrl ? 'Ander favicon kiezen' : 'Favicon uploaden'}
          </button>
        </label>
        <p className="text-xs text-army-400">Aanbevolen: PNG of ICO, 32×32 px, maximaal 512 KB.</p>
        {faviconFout && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {faviconFout}
          </p>
        )}
      </div>

      {foutmelding && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2.5 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {foutmelding}
        </div>
      )}

      <button
        onClick={handleOpslaan}
        disabled={status === 'saving'}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-army-700 hover:bg-army-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
      >
        {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
        {status === 'saved' && <CheckCircle2 size={14} />}
        {status === 'saving' ? 'Opslaan…' : status === 'saved' ? 'Thema opgeslagen!' : 'Thema opslaan'}
      </button>
    </div>
  )
}
