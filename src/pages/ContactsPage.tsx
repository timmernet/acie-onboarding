import { useState } from 'react'
import { CONTACTEN } from '../data/dummyData'
import { Phone, Mail, Search } from 'lucide-react'

export function ContactsPage() {
  const [zoek, setZoek] = useState('')

  const gefilterd = CONTACTEN.filter(c => {
    const q = zoek.toLowerCase()
    return (
      c.naam.toLowerCase().includes(q) ||
      c.functie.toLowerCase().includes(q) ||
      c.rang.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-army-900 font-bold text-xl">Contacten</h2>
        <p className="text-army-500 text-sm mt-0.5">Bij wie moet je zijn voor welke zaken</p>
      </div>

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
