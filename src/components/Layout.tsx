import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, ClipboardList, Users, Settings, BookOpen } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export function Layout({ children }: Props) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const rolLabel = {
    reservist: 'Reservist',
    commandant: 'Commandant',
    beheerder: 'Beheerder',
  }

  const navItems = () => {
    if (!currentUser) return []
    if (currentUser.rol === 'reservist') return [
      { to: '/dashboard', icon: ClipboardList, label: 'Mijn taken' },
      { to: '/contacten', icon: BookOpen, label: 'Contacten' },
    ]
    if (currentUser.rol === 'commandant') return [
      { to: '/commandant', icon: Users, label: 'Voortgang' },
      { to: '/contacten', icon: BookOpen, label: 'Contacten' },
    ]
    // beheerder
    return [
      { to: '/beheerder', icon: Settings, label: 'Beheer' },
      { to: '/commandant', icon: Users, label: 'Voortgang' },
      { to: '/contacten', icon: BookOpen, label: 'Contacten' },
    ]
  }

  const initials = currentUser?.naam
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-army-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-army-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo / title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/Embleem_13_Lichte_Brigade.png" alt="13 Lichte Brigade" className="w-full h-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">A-Compagnie</div>
              <div className="text-army-300 text-xs">30IBB · 13 Lichte Brigade</div>
            </div>
          </div>

          {/* User info + logout */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium">{currentUser.naam}</span>
                <span className="text-army-300 text-xs">
                  {rolLabel[currentUser.rol]} · {currentUser.pelotoon}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-army-600 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-army-700 transition-colors"
                title="Uitloggen"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom navigation (mobile) */}
      {currentUser && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-army-200 z-40 safe-area-bottom">
          <div className="flex">
            {navItems().map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                    active
                      ? 'text-army-700 bg-army-50'
                      : 'text-gray-500 hover:text-army-600'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Desktop sidebar nav — shown as top sub-nav */}
      {currentUser && navItems().length > 1 && (
        <div className="hidden md:block fixed top-16 left-0 right-0 bg-army-700 z-30 shadow">
          <div className="max-w-5xl mx-auto px-4 flex gap-1 h-10 items-center">
            {navItems().map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors border-b-2 ${
                    active
                      ? 'border-gold-400 text-gold-300'
                      : 'border-transparent text-army-200 hover:text-white'
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer for sub-nav on desktop */}
      {currentUser && navItems().length > 1 && (
        <style>{`@media (min-width: 768px) { main { padding-top: 3.5rem; } }`}</style>
      )}
    </div>
  )
}
