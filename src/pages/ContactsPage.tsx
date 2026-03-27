import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Phone, Mail, Search, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Contact } from '../types'

const LEEG: Omit<Contact, 'id'> = {
  naam: '', rang: '', functie: '', telefoon: '', email: '', tags: [],
}

export function ContactsPage() {
  const { contacten, currentUser, addContact, updateContact, deleteContact } = useAuth()
  const [zoek, setZoek] = useState('')
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState<Omit<Contact, 'id'>>(LEEG)
  const [tagsInvoer, setTagsInvoer] = useState('')
  const [nieuw, setNieuw] = useState(false)
  const [verwijderBevestig, setVerwijderBevestig] = useState<string | null>(null)

  const kanBewerken = currentUser?.rol === 'commandant' || currentUser?.rol === 'beheerder'

  const gefilterd = contacten.filter(c => {
    const q = zoek.toLowerCase()
    return (
      c.naam.toLowerCase().includes(q) ||
      c.functie.toLowerCase().includes(q) ||
      c.rang.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    )
  })

  const openNieuw = () => {
    setFormulier(LEEG)
    setTagsInvoer('')
    setBewerkId(null)
    setNieuw(true)
  }

  const openBewerk = (c: Contact) => {
    setFormulier({ naam: c.naam, rang: c.rang, functie: c.functie, telefoon: c.telefoon, email: c.email, tags: c.tags })
    setTagsInvoer(c.tags.join(', '))
    setNieuw(false)
    setBewerkId(c.id)
  }

  const sluitFormulier = () => {
    setBewerkId(null)
    setNieuw(false)
  }

  const slaOp = () => {
    const tags = tagsInvoer.split(',').map(t => t.trim()).filter(Boolean)
    const data = { ...formulier, tags }
    if (nieuw) {
      addContact(data)
    } else if (bewerkId) {
      updateContact({ ...data, id: bewerkId })
    }
    sluitFormulier()
  }

  const veld = (label: string, key: keyof Omit<Contact, 'id' | 'tags'>) => (
    <div>
      <label className="block text-xs font-medium text-army-600 mb-1">{label}</label>
      <input
        type="text"
        value={formulier[key] as string}
        onChange={e => setFormulier(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg border border-army-200 text-sm focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent"
      />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-army-900 font-bold text-xl">Contacten</h2>
          <p className="text-army-500 text-sm mt-0.5">Bij wie moet je zijn voor welke zaken</p>
        </div>
        {kanBewerken && (
          <button
            onClick={openNieuw}
            className="flex items-center gap-1.5 bg-army-700 hover:bg-army-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nieuw
          </button>
        )}
      </div>

      {/* Nieuw / bewerk formulier */}
      {(nieuw || bewerkId) && (
        <div className="bg-white rounded-xl border border-army-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-army-900 text-sm">{nieuw ? 'Nieuw contact' : 'Contact bewerken'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {veld('Naam', 'naam')}
            {veld('Rang', 'rang')}
            {veld('Functie', 'functie')}
            {veld('Telefoon', 'telefoon')}
            {veld('E-mail', 'email')}
            <div>
              <label className="block text-xs font-medium text-army-600 mb-1">Tags (komma-gescheiden)</label>
              <input
                type="text"
                value={tagsInvoer}
                onChange={e => setTagsInvoer(e.target.value)}
                placeholder="bijv. verlof, administratie"
                className="w-full px-3 py-2 rounded-lg border border-army-200 text-sm focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={sluitFormulier}
              className="flex items-center gap-1 text-sm text-army-600 hover:text-army-800 px-3 py-1.5 rounded-lg border border-army-200 hover:bg-army-50 transition-colors"
            >
              <X size={14} /> Annuleer
            </button>
            <button
              onClick={slaOp}
              disabled={!formulier.naam.trim()}
              className="flex items-center gap-1 text-sm bg-army-700 hover:bg-army-800 disabled:bg-army-300 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Zoekbalk */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-army-400" />
        <input
          type="text"
          placeholder="Zoek op naam, functie of onderwerp…"
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-army-200 bg-white focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-transparent text-sm shadow-sm"
        />
      </div>

      {/* Contact cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {gefilterd.map(contact => (
          <div key={contact.id} className="bg-white rounded-xl border border-army-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-army-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {contact.naam
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-army-900 text-sm">
                  {contact.rang} {contact.naam}
                </div>
                <div className="text-army-500 text-xs mt-0.5">{contact.functie}</div>
              </div>
              {kanBewerken && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openBewerk(contact)}
                    className="p-1.5 rounded-lg text-army-400 hover:text-army-700 hover:bg-army-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  {verwijderBevestig === contact.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { deleteContact(contact.id); setVerwijderBevestig(null) }}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setVerwijderBevestig(null)}
                        className="p-1.5 rounded-lg text-army-400 hover:bg-army-50 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setVerwijderBevestig(contact.id)}
                      className="p-1.5 rounded-lg text-army-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Contact details */}
            <div className="mt-3 space-y-1.5">
              <a
                href={`tel:${contact.telefoon.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-sm text-army-700 hover:text-army-900 transition-colors group"
              >
                <Phone size={14} className="text-army-400 group-hover:text-army-600" />
                {contact.telefoon}
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-sm text-army-600 hover:text-army-900 transition-colors group truncate"
              >
                <Mail size={14} className="text-army-400 group-hover:text-army-600 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </a>
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {contact.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-army-50 text-army-600 border border-army-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {gefilterd.length === 0 && (
        <div className="text-center py-12 text-army-400">
          <p className="text-sm">Geen contacten gevonden voor "{zoek}"</p>
        </div>
      )}
    </div>
  )
}
