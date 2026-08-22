import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import Logo from './Logo'

const links = [
  { to: '/', label: 'Home' },
  { to: '/trips', label: 'My trips' },
  { to: '/search', label: 'Browse activities' },
  { to: '/travel', label: 'Travel' },
]

export default function Navbar() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()

  if (!currentUser) return null

  const initials = `${currentUser.firstName?.[0] || currentUser.username?.[0] || '?'}${currentUser.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="sticky top-0 z-50 bg-[var(--ink)]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 md:px-10 h-[68px] flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto">
        <Logo onClick={() => navigate('/')} size={30} textSize={17} textClassName="hidden sm:inline" className="shrink-0" />
        <div className="flex items-center gap-1 flex-1 min-w-0 shrink-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-2.5 sm:px-3.5 py-2 rounded-full text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div
          onClick={() => navigate('/trips/new')}
          className="shrink-0 px-3.5 sm:px-5 py-2.5 rounded-full text-white text-[13px] sm:text-sm font-bold cursor-pointer whitespace-nowrap transition-colors hover:brightness-110"
          style={{ background: 'var(--ac)' }}
        >
          Plan a trip
        </div>
        <div
          onClick={() => navigate('/profile')}
          title={currentUser.email}
          className="shrink-0 w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full border border-white/20 grid place-items-center text-white/80 mono text-xs cursor-pointer bg-[#2a2a3a]"
        >
          {initials}
        </div>
        <div
          onClick={() => { logout(); navigate('/login') }}
          className="shrink-0 text-white/50 hover:text-white text-xs font-bold cursor-pointer hidden sm:block"
        >
          Logout
        </div>
      </div>
    </div>
  )
}
