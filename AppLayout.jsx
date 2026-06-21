import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  FlaskConical,
  Settings,
  CreditCard,
  Building2,
  LogOut,
  Plus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutGrid },
  { to: '/contracts', label: 'عقود الشركات', icon: Building2 },
  { to: '/billing', label: 'الفوترة والاشتراك', icon: CreditCard },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-l border-lab-edge bg-lab-panel/60 backdrop-blur-sm flex flex-col">
        <div className="px-6 py-6 border-b border-lab-edge">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-signal-phosphor" strokeWidth={1.5} />
            <span className="font-display font-semibold text-lg">المختبر</span>
          </div>
          <p className="text-xs text-lab-steel font-mono mt-1">AI Training Orchestrator</p>
        </div>

        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/projects/new')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            مشروع جديد
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-signal-phosphor/10 text-signal-phosphor border border-signal-phosphor/30'
                    : 'text-lab-mist hover:bg-lab-edge/40 hover:text-lab-paper'
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-lab-edge">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm text-lab-paper truncate">{user?.full_name || user?.email}</p>
              <p className="text-xs text-lab-steel font-mono uppercase">{user?.subscription_plan}</p>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="text-lab-steel hover:text-signal-crimson transition-colors p-2"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
