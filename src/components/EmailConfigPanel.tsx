import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

export function EmailConfigPanel() {
  const { appConfig, updateEmailConfig } = useAuth()

  const [host, setHost] = useState('')
  const [port, setPort] = useState('587')
  const [secure, setSecure] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [from, setFrom] = useState('')
  const [admin, setAdmin] = useState('')
  const [toonPass, setToonPass] = useState(false)

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [testStatus, setTestStatus] = useState<'idle' | 'bezig' | 'ok' | 'fout'>('idle')
  const [testFout, setTestFout] = useState('')
  const [foutmelding, setFoutmelding] = useState('')

  useEffect(() => {
    if (appConfig) {
      setHost(appConfig.emailHost || '')
      setPort(String(appConfig.emailPort || 587))
      setSecure(appConfig.emailSecure || false)
      setUser(appConfig.emailUser || '')
      setFrom(appConfig.emailFrom || '')
      setAdmin(appConfig.emailAdmin || '')
    }
  }, [appConfig])

  const handleOpslaan = async () => {
    setStatus('saving')
    setFoutmelding('')
    const result = await updateEmailConfig({
      emailHost: host,
      emailPort: Number(port) || 587,
      emailSecure: secure,
      emailUser: user,
      emailPass: pass,
      emailFrom: from,
      emailAdmin: admin,
    })
    if (result.ok) {
      setPass('')
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setFoutmelding(result.error ?? 'Opslaan mislukt')
      setStatus('error')
    }
  }

  const handleTest = async () => {
    setTestStatus('bezig')
    setTestFout('')
    try {
      const res = await fetch('/api/config/email/test', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setTestStatus('ok')
        setTimeout(() => setTestStatus('idle'), 4000)
      } else {
        const data = await res.json()
        setTestFout(data.error ?? 'Onbekende fout')
        setTestStatus('fout')
      }
    } catch {
      setTestFout('Netwerkfout')
      setTestStatus('fout')
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-army-500 text-sm">
        Configureer de SMTP-server voor het versturen van activatie- en reset-e-mails.
      </p>

      <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-army-800 text-sm flex items-center gap-2">
          <Mail size={15} /> Serverinstellingen
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-army-600 mb-1">SMTP-server (host)</label>
            <input
              type="text"
              placeholder="mail.voorbeeld.nl"
              value={host}
              onChange={e => setHost(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Poort</label>
            <input
              type="number"
              placeholder="587"
              value={port}
              onChange={e => setPort(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={secure}
            onChange={e => setSecure(e.target.checked)}
            className="rounded border-army-300 text-army-600 focus:ring-army-500"
          />
          <span className="text-sm text-army-700">SSL/TLS (poort 465)</span>
        </label>

        <div className="border-t border-army-100 pt-4 space-y-3">
          <h3 className="font-semibold text-army-800 text-sm">Authenticatie</h3>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Gebruikersnaam</label>
            <input
              type="text"
              placeholder="noreply@voorbeeld.nl"
              value={user}
              onChange={e => setUser(e.target.value)}
              className={INPUT}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">
              Wachtwoord {appConfig?.emailUser && <span className="text-army-400 font-normal">(laat leeg om niet te wijzigen)</span>}
            </label>
            <div className="relative">
              <input
                type={toonPass ? 'text' : 'password'}
                placeholder={appConfig?.emailUser ? '••••••••' : 'Wachtwoord'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                className={INPUT + ' pr-10'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setToonPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-army-400 hover:text-army-700"
              >
                {toonPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-army-100 pt-4 space-y-3">
          <h3 className="font-semibold text-army-800 text-sm">Afzender & admin</h3>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Afzendernaam / e-mailadres</label>
            <input
              type="text"
              placeholder="Naam Portaal <noreply@voorbeeld.nl>"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-army-600 mb-1">Admin e-mailadres (nieuwe registraties)</label>
            <input
              type="email"
              placeholder="beheerder@voorbeeld.nl"
              value={admin}
              onChange={e => setAdmin(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        {foutmelding && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2.5 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {foutmelding}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleOpslaan}
            disabled={status === 'saving'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-army-700 hover:bg-army-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {status === 'saved' && <CheckCircle2 size={14} />}
            {status === 'saving' ? 'Opslaan…' : status === 'saved' ? 'Opgeslagen!' : 'Instellingen opslaan'}
          </button>

          <button
            onClick={handleTest}
            disabled={testStatus === 'bezig' || !host}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-army-300 text-army-700 hover:bg-army-50 disabled:opacity-50 text-sm font-medium transition-colors"
            title="Stuur een test-e-mail naar je eigen adres"
          >
            {testStatus === 'bezig' && <Loader2 size={14} className="animate-spin" />}
            {testStatus === 'ok' && <CheckCircle2 size={14} className="text-green-600" />}
            {testStatus === 'fout' && <AlertCircle size={14} className="text-red-500" />}
            Test
          </button>
        </div>

        {testStatus === 'ok' && (
          <p className="text-xs text-green-600">Test-e-mail verzonden naar je account.</p>
        )}
        {testStatus === 'fout' && testFout && (
          <p className="text-xs text-red-600">{testFout}</p>
        )}
      </div>
    </div>
  )
}
