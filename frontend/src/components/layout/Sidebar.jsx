import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3, Briefcase, FileEdit, FileText, KanbanSquare,
  LayoutDashboard, LogOut, Sparkles, Star, User, Zap, X, ChevronRight, Settings, Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth'
import useAuthStore from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Command Center' },
  { to: '/resumes',            icon: FileText,        label: 'Resume Library' },
  { to: '/job-descriptions',   icon: Briefcase,       label: 'Job Catalog' },
  { to: '/applications',       icon: KanbanSquare,    label: 'Kanban Board' },
  { to: '/job-recommendations',icon: Star,            label: 'AI Match Recs' },
  { to: '/cv-generator',       icon: Sparkles,        label: 'Asset Forge' },
  { to: '/resume-generator',   icon: FileEdit,        label: 'Optimizer' },
  { to: '/analytics',          icon: BarChart3,       label: 'Performance' },
]

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user   = useAuthStore((s) => s.user)

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { if (refresh) await authAPI.logout(refresh) } catch {}
    logout()
    navigate('/', { replace: true })
    toast.success('Session Terminated')
    if (onClose) onClose()
  }

  return (
    <aside
      className="h-full w-72 flex flex-col relative"
      style={{
        background: '#ffffff',
        borderRight: '1px solid rgba(124,58,237,0.1)',
        boxShadow: '10px 0 50px rgba(124,58,237,0.03)',
      }}
    >
      {/* Branding Section */}
      <div className="px-7 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-[5deg]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
              }}
            >
              <Zap size={22} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-text-heading leading-none">RoleIQ</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-purple">
                  Career IQ v4.0
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-2.5 rounded-xl hover:bg-purple-50 text-text-muted transition-colors border border-purple-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Identity Context */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden group transition-all hover:border-purple/30"
          style={{ 
            background: 'linear-gradient(135deg, #f9f8ff 0%, #f5f4ff 100%)', 
            border: '1px solid rgba(124,58,237,0.12)' 
          }}
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple/5 rounded-full -mr-6 -mt-6 blur-xl" />
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 bg-white border border-purple/10 shadow-sm transition-transform group-hover:scale-110"
          >
            <User size={18} className="text-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-black text-text-heading truncate leading-tight">
              {user?.full_name || 'Anonymous User'}
            </p>
            <p className="text-[11px] font-bold truncate text-text-muted mt-0.5">
              Verified Session
            </p>
          </div>
          <ChevronRight size={14} className="ml-auto text-text-muted/40 group-hover:text-purple group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-text-muted/50 mb-3">Main Engine</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[13px] font-bold transition-all duration-300"
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(124,58,237,0.25)',
                    transform: 'translateX(4px)',
                  }
                : { color: '#9589b8', background: 'transparent' }
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={`flex-shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-purple group-hover:scale-110'}`}
                />
                <span className={isActive ? 'font-black' : ''}>{item.label}</span>
                {!isActive && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                    <ChevronRight size={14} />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Integrity & Sign Out */}
      <div className="p-6 mt-auto">
        <div className="p-4 rounded-[24px] bg-purple-50/50 border border-purple-100 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-purple-100 flex items-center justify-center text-purple">
              <Cpu size={14} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-text-heading">AI Status</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted">Core Engine</span>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Optimal</span>
          </div>
          <div className="h-1 w-full bg-white rounded-full mt-2 overflow-hidden border border-purple-100/50">
            <div className="h-full bg-emerald-500 w-[94%]" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-black text-text-muted hover:bg-purple-50 hover:text-purple transition-all border border-transparent hover:border-purple/10"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-[3] flex items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/20"
          >
            <LogOut size={16} />
            <span>Terminate</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
