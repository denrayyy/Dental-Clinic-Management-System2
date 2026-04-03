import { NavLink } from 'react-router-dom'
import clinicLogo from '../../assets/logo.png'

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Staff', path: '/staff' },
  { label: 'Services', path: '/services' },
  { label: 'Reports', path: '/reports' },
  { label: 'Logs', path: '/logs' },
]

const Sidebar = ({ onLogout }) => {
  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-[#0f172a] px-5 py-6 text-slate-100 md:sticky md:top-0 md:flex md:h-screen md:w-72 md:flex-col md:border-b-0 md:border-r md:px-6">
      <div className="mb-6 flex flex-col items-center pb-2 md:mb-8">
        <img
          src={clinicLogo}
          alt="Clinic logo"
          className="h-20 w-auto max-w-[160px] object-contain drop-shadow-[0_8px_18px_rgba(34,211,238,0.25)]"
        />
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin</p>
      </div>

      <nav className="grid gap-2 md:flex-1 md:content-start">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              [
                'rounded-xl px-4 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-cyan-400/20 text-cyan-200'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 pt-2 md:mt-auto">
        <button
          onClick={onLogout}
          className="w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
