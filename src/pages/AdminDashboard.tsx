import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Taak, Contact } from '../types'
import { Shield, Users, Plus, Pencil, Trash2, X, ClipboardList, BookOpen, ChevronUp, ChevronDown, Mail, Palette, Layers } from 'lucide-react'
import { UserBeheerPanel } from '../components/UserBeheerPanel'
import { EmailConfigPanel } from '../components/EmailConfigPanel'
import { ThemaPanel } from '../components/ThemaPanel'
import { EenhedenPanel } from '../components/EenhedenPanel'
import AuditLogPanel from '../components/AuditLogPanel'

const INPUT = 'w-full px-3 py-2 rounded-lg border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm'

type Tab = 'Gebruikers' | 'Eenheden' | 'Taken' | 'Contacten' | 'E-mail' | 'Thema' | 'Auditlog'

const leegeTaak = (): Omit<Taak, 'id'> => ({ titel: '', beschrijving: '', categorie: '', contactId: '', vereistTaakId: undefined })
const leegeContact = (): Omit<Contact, 'id'> => ({ naam: '', rang: '', functie: '', telefoon: '', email: '', tags: [] })

export function AdminDashboard() {
  const {
    currentUser,
    taken, moveTaakOmhoog, moveTaakOmlaag, addTaak, updateTaak, deleteTaak,
    contacten, addContact, updateContact, deleteContact,
  } = useAuth()

  const isBeheerder = currentUser?.rol === 'beheerder'
  const [actieveTab, setActieveTab] = useState<Tab>('Gebruikers')

  // Taken
  const [taakFormOpen, setTaakFormOpen] = useState(false)
  const [nieuweTaak, setNieuweTaak] = useState(leegeTaak())
  const [bewerkTaakId, setBewerkTaakId] = useState<string | null>(null)
  const [bewerkTaakData, setBewerkTaakData] = useState<Taak | null>(null)
  const [verwijderTaakId, setVerwijderTaakId] = useState<string | null>(null)

  // Contacten
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [nieuwContact, setNieuwContact] = useState(leegeContact())
  const [nieuwContactTagsStr, setNieuwContactTagsStr] = useState('')
  const [bewerkContactId, setBewerkContactId] = useState<string | null>(null)
  const [bewerkContactData, setBewerkContactData] = useState<Contact | null>(null)
  const [bewerkContactTagsStr, setBewerkContactTagsStr] = useState('')
  const [verwijderContactId, setVerwijderContactId] = useState<string | null>(null)

  // --- Taken ---
  const handleTaakOpslaan = () => {
    if (!nieuweTaak.titel.trim()) return
    addTaak(nieuweTaak)
    setNieuweTaak(leegeTaak())
    setTaakFormOpen(false)
  }

  const startBewerkTaak = (taak: Taak) => {
    setBewerkTaakId(taak.id)
    setBewerkTaakData({ ...taak })
  }

  const handleTaakBewerken = () => {
    if (!bewerkTaakData?.titel.trim()) return
    updateTaak(bewerkTaakData)
    setBewerkTaakId(null)
    setBewerkTaakData(null)
  }

  // --- Contacten ---
  const handleContactOpslaan = () => {
    if (!nieuwContact.naam.trim()) return
    addContact({
      ...nieuwContact,
      tags: nieuwContactTagsStr.split(',').map(t => t.trim()).filter(Boolean),
    })
    setNieuwContact(leegeContact())
    setNieuwContactTagsStr('')
    setContactFormOpen(false)
  }

  const startBewerkContact = (contact: Contact) => {
    setBewerkContactId(contact.id)
    setBewerkContactData({ ...contact })
    setBewerkContactTagsStr(contact.tags.join(', '))
  }

  const handleContactBewerken = () => {
    if (!bewerkContactData?.naam.trim()) return
    updateContact({
      ...bewerkContactData,
      tags: bewerkContactTagsStr.split(',').map(t => t.trim()).filter(Boolean),
    })
    setBewerkContactId(null)
    setBewerkContactData(null)
    setBewerkContactTagsStr('')
  }

  const alleTabs: { key: Tab; label: string; icon: React.ReactNode; beheerderOnly?: boolean }[] = [
    { key: 'Gebruikers', label: 'Gebruikers', icon: <Users size={15} /> },
    { key: 'Eenheden', label: 'Eenheden', icon: <Layers size={15} /> },
    { key: 'Taken', label: 'Taken', icon: <ClipboardList size={15} /> },
    { key: 'Contacten', label: 'Contacten', icon: <BookOpen size={15} /> },
    { key: 'E-mail', label: 'E-mail', icon: <Mail size={15} />, beheerderOnly: true },
    { key: 'Thema', label: 'Thema', icon: <Palette size={15} />, beheerderOnly: true },
    { key: 'Auditlog', label: 'Auditlog', icon: <Shield size={15} />, beheerderOnly: true },
  ]
  const tabs = alleTabs.filter(t => !t.beheerderOnly || isBeheerder)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-army-900 font-bold text-xl flex items-center gap-2">
          <Shield size={20} /> Beheer
        </h2>
        <p className="text-army-500 text-sm mt-0.5">
          {isBeheerder ? 'Beheer gebruikers, taken, contacten, e-mail en thema' : 'Beheer gebruikers, taken en contacten'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-army-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActieveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              actieveTab === tab.key
                ? 'bg-white text-army-800 shadow-sm'
                : 'text-army-500 hover:text-army-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* === GEBRUIKERS TAB === */}
      {actieveTab === 'Gebruikers' && <UserBeheerPanel />}

      {/* === EENHEDEN TAB === */}
      {actieveTab === 'Eenheden' && <EenhedenPanel />}

      {/* === TAKEN TAB === */}
      {actieveTab === 'Taken' && (
        <div className="space-y-4">
          {/* Toevoegen knop / formulier */}
          {!taakFormOpen ? (
            <button
              onClick={() => setTaakFormOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-army-300 text-army-600 hover:border-army-500 hover:text-army-800 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Nieuwe taak toevoegen
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-army-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-army-800 text-sm">Nieuwe taak</span>
                <button onClick={() => { setTaakFormOpen(false); setNieuweTaak(leegeTaak()) }} className="text-army-400 hover:text-army-700">
                  <X size={16} />
                </button>
              </div>
              <input type="text" placeholder="Titel *" value={nieuweTaak.titel} onChange={e => setNieuweTaak(p => ({ ...p, titel: e.target.value }))} className={INPUT} />
              <textarea placeholder="Beschrijving" rows={3} value={nieuweTaak.beschrijving} onChange={e => setNieuweTaak(p => ({ ...p, beschrijving: e.target.value }))} className={INPUT} />
              <input type="text" placeholder="Categorie (bijv. Administratie, IT, Medisch)" value={nieuweTaak.categorie} onChange={e => setNieuweTaak(p => ({ ...p, categorie: e.target.value }))} className={INPUT} />
              <select value={nieuweTaak.contactId} onChange={e => setNieuweTaak(p => ({ ...p, contactId: e.target.value }))} className={INPUT}>
                <option value="">— Geen contactpersoon —</option>
                {contacten.map(c => <option key={c.id} value={c.id}>{c.rang} {c.naam} — {c.functie}</option>)}
              </select>
              <select value={nieuweTaak.vereistTaakId ?? ''} onChange={e => setNieuweTaak(p => ({ ...p, vereistTaakId: e.target.value || undefined }))} className={INPUT}>
                <option value="">— Geen vereiste taak —</option>
                {taken.map(t => <option key={t.id} value={t.id}>{t.titel}</option>)}
              </select>
              <button onClick={handleTaakOpslaan} disabled={!nieuweTaak.titel.trim()} className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Taak opslaan
              </button>
            </div>
          )}

          {/* Takenlijst */}
          <div className="space-y-2">
            {taken.map((taak, index) => {
              const vereisteTaak = taak.vereistTaakId ? taken.find(t => t.id === taak.vereistTaakId) : null
              return (
                <div key={taak.id} className="bg-white rounded-xl border border-army-100 shadow-sm overflow-hidden">
                  {bewerkTaakId === taak.id && bewerkTaakData ? (
                    // Edit form
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-army-800 text-sm">Taak bewerken</span>
                        <button onClick={() => { setBewerkTaakId(null); setBewerkTaakData(null) }} className="text-army-400 hover:text-army-700">
                          <X size={16} />
                        </button>
                      </div>
                      <input type="text" placeholder="Titel *" value={bewerkTaakData.titel} onChange={e => setBewerkTaakData(p => p && ({ ...p, titel: e.target.value }))} className={INPUT} />
                      <textarea placeholder="Beschrijving" rows={3} value={bewerkTaakData.beschrijving} onChange={e => setBewerkTaakData(p => p && ({ ...p, beschrijving: e.target.value }))} className={INPUT} />
                      <input type="text" placeholder="Categorie" value={bewerkTaakData.categorie} onChange={e => setBewerkTaakData(p => p && ({ ...p, categorie: e.target.value }))} className={INPUT} />
                      <select value={bewerkTaakData.contactId} onChange={e => setBewerkTaakData(p => p && ({ ...p, contactId: e.target.value }))} className={INPUT}>
                        <option value="">— Geen contactpersoon —</option>
                        {contacten.map(c => <option key={c.id} value={c.id}>{c.rang} {c.naam} — {c.functie}</option>)}
                      </select>
                      <select value={bewerkTaakData.vereistTaakId ?? ''} onChange={e => setBewerkTaakData(p => p && ({ ...p, vereistTaakId: e.target.value || undefined }))} className={INPUT}>
                        <option value="">— Geen vereiste taak —</option>
                        {taken.filter(t => t.id !== bewerkTaakData.id).map(t => <option key={t.id} value={t.id}>{t.titel}</option>)}
                      </select>
                      <button onClick={handleTaakBewerken} disabled={!bewerkTaakData.titel.trim()} className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Wijzigingen opslaan
                      </button>
                    </div>
                  ) : (
                    // View row
                    <div className="flex items-center gap-2 p-3">
                      {/* Volgorde knoppen */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveTaakOmhoog(taak.id)} disabled={index === 0} className="p-0.5 rounded text-army-300 hover:text-army-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveTaakOmlaag(taak.id)} disabled={index === taken.length - 1} className="p-0.5 rounded text-army-300 hover:text-army-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-army-300 w-5 text-center flex-shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-army-900 text-sm">{taak.titel}</div>
                        <div className="text-army-400 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{taak.categorie}</span>
                          {vereisteTaak && (
                            <span className="text-amber-600">↳ na: {vereisteTaak.titel}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {verwijderTaakId === taak.id ? (
                          <>
                            <span className="text-xs text-red-600 font-medium self-center mr-1">Verwijderen?</span>
                            <button onClick={() => { deleteTaak(taak.id); setVerwijderTaakId(null) }} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                              Ja
                            </button>
                            <button onClick={() => setVerwijderTaakId(null)} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors">
                              Nee
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startBewerkTaak(taak)} className="p-1.5 rounded-lg text-army-500 hover:bg-army-50 hover:text-army-800 transition-colors" title="Bewerken">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => setVerwijderTaakId(taak.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-700 transition-colors" title="Verwijderen">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {taken.length === 0 && (
              <div className="text-center py-12 text-army-400 text-sm bg-white rounded-xl border border-army-100">
                Nog geen taken aangemaakt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* === E-MAIL TAB === */}
      {actieveTab === 'E-mail' && <EmailConfigPanel />}

      {/* === THEMA TAB === */}
      {actieveTab === 'Thema' && <ThemaPanel />}

      {/* === AUDITLOG TAB === */}
      {actieveTab === 'Auditlog' && <AuditLogPanel />}

      {/* === CONTACTEN TAB === */}
      {actieveTab === 'Contacten' && (
        <div className="space-y-4">
          {/* Toevoegen knop / formulier */}
          {!contactFormOpen ? (
            <button
              onClick={() => setContactFormOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-army-300 text-army-600 hover:border-army-500 hover:text-army-800 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Nieuw contact toevoegen
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-army-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-army-800 text-sm">Nieuw contact</span>
                <button onClick={() => { setContactFormOpen(false); setNieuwContact(leegeContact()); setNieuwContactTagsStr('') }} className="text-army-400 hover:text-army-700">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Naam *" value={nieuwContact.naam} onChange={e => setNieuwContact(p => ({ ...p, naam: e.target.value }))} className={INPUT} />
                <input type="text" placeholder="Rang (bijv. Kpl., 1Lt.)" value={nieuwContact.rang} onChange={e => setNieuwContact(p => ({ ...p, rang: e.target.value }))} className={INPUT} />
              </div>
              <input type="text" placeholder="Functie" value={nieuwContact.functie} onChange={e => setNieuwContact(p => ({ ...p, functie: e.target.value }))} className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Telefoon" value={nieuwContact.telefoon} onChange={e => setNieuwContact(p => ({ ...p, telefoon: e.target.value }))} className={INPUT} />
                <input type="email" placeholder="E-mail" value={nieuwContact.email} onChange={e => setNieuwContact(p => ({ ...p, email: e.target.value }))} className={INPUT} />
              </div>
              <input type="text" placeholder="Tags (kommagescheiden)" value={nieuwContactTagsStr} onChange={e => setNieuwContactTagsStr(e.target.value)} className={INPUT} />
              <button
                onClick={handleContactOpslaan}
                disabled={!nieuwContact.naam.trim()}
                className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Contact opslaan
              </button>
            </div>
          )}

          {/* Contactenlijst */}
          <div className="space-y-2">
            {contacten.map(contact => (
              <div key={contact.id} className="bg-white rounded-xl border border-army-100 shadow-sm overflow-hidden">
                {bewerkContactId === contact.id && bewerkContactData ? (
                  // Edit form
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-army-800 text-sm">Contact bewerken</span>
                      <button onClick={() => { setBewerkContactId(null); setBewerkContactData(null) }} className="text-army-400 hover:text-army-700">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Naam *" value={bewerkContactData.naam} onChange={e => setBewerkContactData(p => p && ({ ...p, naam: e.target.value }))} className={INPUT} />
                      <input type="text" placeholder="Rang" value={bewerkContactData.rang} onChange={e => setBewerkContactData(p => p && ({ ...p, rang: e.target.value }))} className={INPUT} />
                    </div>
                    <input type="text" placeholder="Functie" value={bewerkContactData.functie} onChange={e => setBewerkContactData(p => p && ({ ...p, functie: e.target.value }))} className={INPUT} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Telefoon" value={bewerkContactData.telefoon} onChange={e => setBewerkContactData(p => p && ({ ...p, telefoon: e.target.value }))} className={INPUT} />
                      <input type="email" placeholder="E-mail" value={bewerkContactData.email} onChange={e => setBewerkContactData(p => p && ({ ...p, email: e.target.value }))} className={INPUT} />
                    </div>
                    <input type="text" placeholder="Tags (kommagescheiden)" value={bewerkContactTagsStr} onChange={e => setBewerkContactTagsStr(e.target.value)} className={INPUT} />
                    <button
                      onClick={handleContactBewerken}
                      disabled={!bewerkContactData.naam.trim()}
                      className="w-full py-2 rounded-lg bg-army-700 text-white text-sm font-semibold hover:bg-army-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Wijzigingen opslaan
                    </button>
                  </div>
                ) : (
                  // View row
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 rounded-full bg-army-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {contact.naam.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-army-900 text-sm">{contact.rang} {contact.naam}</div>
                      <div className="text-army-400 text-xs truncate">{contact.functie}</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {verwijderContactId === contact.id ? (
                        <>
                          <span className="text-xs text-red-600 font-medium self-center mr-1">Verwijderen?</span>
                          <button onClick={() => { deleteContact(contact.id); setVerwijderContactId(null) }} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                            Ja
                          </button>
                          <button onClick={() => setVerwijderContactId(null)} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors">
                            Nee
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startBewerkContact(contact)} className="p-1.5 rounded-lg text-army-500 hover:bg-army-50 hover:text-army-800 transition-colors" title="Bewerken">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setVerwijderContactId(contact.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-700 transition-colors" title="Verwijderen">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {contacten.length === 0 && (
              <div className="text-center py-12 text-army-400 text-sm bg-white rounded-xl border border-army-100">
                Nog geen contacten aangemaakt.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
