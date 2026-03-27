import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { FolderOpen, Upload, Trash2, FileText, File, Image, ExternalLink, X, AlertCircle } from 'lucide-react'
import type { Bestand } from '../types'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function BestandsIcoon({ mime, size = 20 }: { mime: string; size?: number }) {
  if (mime === 'application/pdf' || mime.includes('pdf'))
    return <FileText size={size} className="text-red-500" />
  if (mime.includes('word') || mime.includes('document') || mime.includes('msword'))
    return <FileText size={size} className="text-blue-500" />
  if (mime.startsWith('image/'))
    return <Image size={size} className="text-purple-500" />
  return <File size={size} className="text-army-400" />
}

export function DocumentenPage() {
  const { currentUser, bestanden, uploadBestand, deleteBestand } = useAuth()
  const [actieveCategorie, setActieveCategorie] = useState('Alle')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFout, setUploadFout] = useState('')
  const [verwijderId, setVerwijderId] = useState<string | null>(null)

  const [naam, setNaam] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [categorie, setCategorie] = useState('')
  const [bestand, setBestand] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const kanBeheren = currentUser?.rol === 'commandant' || currentUser?.rol === 'beheerder'

  const categorieen = ['Alle', ...Array.from(new Set(bestanden.map(b => b.categorie).filter(Boolean))).sort()]

  const gefilterd = actieveCategorie === 'Alle'
    ? bestanden
    : bestanden.filter(b => b.categorie === actieveCategorie)

  const handleUpload = async () => {
    if (!bestand) return
    setUploadFout('')
    setUploading(true)
    try {
      await uploadBestand(bestand, naam, beschrijving, categorie)
      setNaam('')
      setBeschrijving('')
      setCategorie('')
      setBestand(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadOpen(false)
    } catch (e) {
      setUploadFout(e instanceof Error ? e.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  const handleOpen = (b: Bestand) => {
    window.open(b.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-army-900 font-bold text-xl flex items-center gap-2">
            <FolderOpen size={20} /> Documenten
          </h2>
          <p className="text-army-500 text-sm mt-0.5">Procedures, handboeken en instructies</p>
        </div>
        {kanBeheren && !uploadOpen && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-army-700 text-white text-sm font-semibold hover:bg-army-800 transition-colors"
          >
            <Upload size={15} /> Uploaden
          </button>
        )}
      </div>

      {/* Upload formulier */}
      {kanBeheren && uploadOpen && (
        <div className="bg-white rounded-xl border border-army-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-army-800 text-sm">Document uploaden</span>
            <button onClick={() => { setUploadOpen(false); setUploadFout('') }} className="text-army-400 hover:text-army-700">
              <X size={16} />
            </button>
          </div>

          {/* Bestand kiezen */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-army-200 rounded-lg p-5 text-center cursor-pointer hover:border-army-400 transition-colors"
          >
            {bestand ? (
              <div className="flex items-center justify-center gap-2">
                <BestandsIcoon mime={bestand.type} size={18} />
                <span className="text-sm text-army-700 font-medium">{bestand.name}</span>
                <span className="text-xs text-army-400">({formatBytes(bestand.size)})</span>
              </div>
            ) : (
              <div className="text-army-400 text-sm">
                <Upload size={20} className="mx-auto mb-1" />
                Klik om een bestand te kiezen (max. 5 MB)
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] ?? null
                setBestand(f)
                if (f && !naam) setNaam(f.name.replace(/\.[^/.]+$/, ''))
              }}
            />
          </div>

          <input type="text" placeholder="Naam *" value={naam} onChange={e => setNaam(e.target.value)} className={INPUT} />
          <textarea placeholder="Beschrijving (optioneel)" rows={2} value={beschrijving} onChange={e => setBeschrijving(e.target.value)} className={INPUT} />
          <input type="text" placeholder="Categorie (bijv. Procedure, Handboek, Instructie)" value={categorie} onChange={e => setCategorie(e.target.value)} className={INPUT} />

          {uploadFout && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {uploadFout}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!bestand || !naam.trim() || uploading}
            className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Bezig met uploaden…' : 'Uploaden'}
          </button>
        </div>
      )}

      {/* Categorie filter */}
      {categorieen.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categorieen.map(c => (
            <button
              key={c}
              onClick={() => setActieveCategorie(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                actieveCategorie === c
                  ? 'bg-army-700 text-white'
                  : 'bg-white text-army-600 border border-army-200 hover:border-army-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Documentenlijst */}
      <div className="space-y-2">
        {gefilterd.length === 0 && (
          <div className="text-center py-16 text-army-400 bg-white rounded-xl border border-army-100">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {bestanden.length === 0
                ? kanBeheren ? 'Nog geen documenten. Upload het eerste document.' : 'Nog geen documenten beschikbaar.'
                : 'Geen documenten in deze categorie.'}
            </p>
          </div>
        )}

        {gefilterd.map(b => (
          <div key={b.id} className="bg-white rounded-xl border border-army-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <BestandsIcoon mime={b.bestandstype} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-army-900 text-sm">{b.naam}</div>
                {b.beschrijving && (
                  <p className="text-army-500 text-xs mt-0.5">{b.beschrijving}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {b.categorie && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-army-50 text-army-600 border border-army-100">
                      {b.categorie}
                    </span>
                  )}
                  <span className="text-xs text-army-400">{b.bestandsnaam}</span>
                  <span className="text-xs text-army-400">·</span>
                  <span className="text-xs text-army-400">{formatBytes(b.grootte)}</span>
                  <span className="text-xs text-army-400">·</span>
                  <span className="text-xs text-army-400">
                    {new Date(b.geuploadOp).toLocaleDateString('nl-NL')} door {b.geuploadDoor}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleOpen(b)}
                  className="p-1.5 rounded-lg text-army-500 hover:bg-army-50 hover:text-army-800 transition-colors"
                  title="Openen"
                >
                  <ExternalLink size={15} />
                </button>

                {kanBeheren && (
                  verwijderId === b.id ? (
                    <>
                      <span className="text-xs text-red-600 font-medium">Verwijderen?</span>
                      <button onClick={() => { deleteBestand(b.id); setVerwijderId(null) }} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                        Ja
                      </button>
                      <button onClick={() => setVerwijderId(null)} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors">
                        Nee
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setVerwijderId(b.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 size={15} />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
