import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight, LayoutDashboard, Briefcase, FileText,
  KanbanSquare, Star, Clock, AlertCircle, TrendingUp, Sparkles,
  Award, Rocket, Globe, ChevronRight, Zap, Target, LoaderCircle
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { dashboardAPI } from '../api/dashboard'
import useAuthStore from '../store/authStore'

/* ── Stat Card ─────────────────────────── */
function StatCard({ label, value, subtext, gradient, icon: Icon, color = "purple" }) {
  return (
    <article className="glass-card rounded-[32px] p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-brand-purple/5">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="relative z-10">
        <div
          className="inline-flex items-center justify-center p-3.5 rounded-2xl mb-6 transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110"
          style={{ background: gradient, boxShadow: `0 8px 24px ${gradient.includes('#7c3aed') ? 'rgba(124,58,237,0.3)' : 'rgba(0,0,0,0.1)'}` }}
        >
          {Icon && <Icon size={22} className="text-white" />}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-text-muted">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black text-text-heading tracking-tight group-hover:text-brand-purple transition-colors duration-300">{value}</p>
        </div>
        <p className="mt-2 text-[11px] font-bold text-text-muted flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500`} />
          {subtext}
        </p>
      </div>
    </article>
  )
}

/* ── Quick Actions ─────────────────────── */
const QUICK_ACTIONS = [
  {
    to: '/resumes',
    label: 'Upload Asset',
    desc: 'Deploy new resume version',
    icon: Upload,
    color: 'purple',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  },
  {
    to: '/job-descriptions',
    label: 'Analyze Role',
    desc: 'Decode job requirements',
    icon: Sparkles,
    color: 'blue',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    to: '/applications',
    label: 'Sync Pipeline',
    desc: 'Manage active applications',
    icon: Rocket,
    color: 'cyan',
    gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
  },
  {
    to: '/job-recommendations',
    label: 'Smart Match',
    desc: 'Explore AI predictions',
    icon: Target,
    color: 'amber',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
]

function Upload(props) { return <FileText {...props} /> } // Helper

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get().then((r) => r.data),
  })

  const stats = data?.application_stats || { total: 0, by_status: {}, response_rate: 0 }
  const activeResume = data?.active_resume

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ── Dynamic Command Center Hero ────────────────── */}
        <section
          className="relative rounded-[40px] p-10 md:p-14 overflow-hidden animate-slide-up shadow-2xl shadow-brand-purple/20"
          style={{
            background: 'linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #7c3aed 100%)',
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Command Center Active
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-6">
                Leveling up,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                  {user?.full_name?.split(' ')[0] || 'Agent'}
                </span>
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/70">
                Your AI-driven career trajectory is live. We've mapped <span className="text-white font-black">{stats.total}</span> points of engagement and <span className="text-white font-black">13</span> skill clusters.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-10">
                <Link to="/job-descriptions" className="px-8 py-4 rounded-2xl bg-white text-brand-purple font-black text-sm shadow-xl hover:scale-[1.05] active:scale-[0.98] transition-all">
                  Analyze New JD
                </Link>
                <Link to="/resumes" className="px-8 py-4 rounded-2xl bg-white/10 text-white border border-white/20 font-black text-sm backdrop-blur-md hover:bg-white/20 transition-all">
                  Audit Resumes
                </Link>
              </div>
            </div>

            {/* Time & Intelligence Widget */}
            <div className="flex flex-col gap-4">
              <div
                className="flex items-center gap-6 px-8 py-6 rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white/50">
                    System Time
                  </p>
                  <p className="text-4xl font-black text-white tabular-nums tracking-tighter">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white/50">
                    Sync Status
                  </p>
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-400" />
                    <span className="text-sm font-black text-white uppercase tracking-widest">Global</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-[32px] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Market Value</p>
                    <p className="text-sm font-black text-white">+12% Growth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Intelligence Grid ─────────────────── */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Impact" value={stats.total || 0}
            subtext="Applications tracked"
            gradient="linear-gradient(135deg, #7c3aed, #6d28d9)" icon={KanbanSquare} color="purple"
          />
          <StatCard label="Conversion" value={`${stats.response_rate || 0}%`}
            subtext="Response velocity"
            gradient="linear-gradient(135deg, #3b82f6, #2563eb)" icon={TrendingUp} color="blue"
          />
          <StatCard label="Active Master" value={activeResume?.version_name ? activeResume.version_name.split(' ')[0] : '--'}
            subtext={activeResume?.version_name || "No active asset"}
            gradient="linear-gradient(135deg, #f59e0b, #d97706)" icon={Award} color="amber"
          />
          <StatCard label="Critical Tasks" value={data?.pending_hil ?? 0}
            subtext="Action required"
            gradient="linear-gradient(135deg, #0891b2, #0e7490)" icon={AlertCircle} color="cyan"
          />
        </section>

        {/* ── Operational View ────────────────── */}
        <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
          
          <div className="space-y-8">
            {/* Quick Actions Grid */}
            <article className="glass-card rounded-[40px] p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-text-heading tracking-tight">Tactical Actions</h2>
                  <p className="text-[12px] font-medium text-text-muted mt-1">High-priority operational shortcuts</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 flex items-center justify-center text-brand-purple">
                  <Zap size={24} />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="group relative flex items-start gap-4 p-6 rounded-3xl border border-brand-purple/10 bg-white hover:border-brand-purple/30 hover:shadow-xl hover:shadow-brand-purple/5 transition-all duration-300"
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: a.gradient, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                    >
                      <a.icon size={20} className="text-white" />
                    </div>
                    <div className="min-w-0 pr-4">
                      <p className="text-[15px] font-black text-text-heading mb-1 group-hover:text-brand-purple transition-colors">
                        {a.label}
                      </p>
                      <p className="text-[12px] font-medium text-text-muted leading-snug">{a.desc}</p>
                    </div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={18} className="text-brand-purple" />
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            {/* Application Pulse */}
            <article className="glass-card rounded-[40px] p-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-text-heading tracking-tight">Pipeline Velocity</h2>
                  <p className="text-[12px] font-medium text-text-muted mt-1">Real-time status distribution</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp size={24} />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-6">
                  {[1,2,3,4].map((i) => <div key={i} className="h-4 rounded-full skeleton" />)}
                </div>
              ) : Object.keys(stats.by_status || {}).length === 0 ? (
                <div
                  className="text-center py-12 rounded-[32px] border-2 border-dashed border-brand-purple/10 bg-brand-purple/5"
                >
                  <KanbanSquare size={48} className="mx-auto mb-4 text-brand-purple/20" />
                  <h3 className="text-lg font-bold text-text-heading">No Pulse Detected</h3>
                  <p className="text-sm text-text-muted mt-1 max-w-[200px] mx-auto">Add your first application to initialize tracking.</p>
                  <Link to="/applications" className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-purple text-white text-[12px] font-bold shadow-lg shadow-brand-purple/20">
                    Initialize Pipeline
                  </Link>
                </div>
              ) : (
                <div className="grid gap-8">
                  {Object.entries(stats.by_status).map(([status, count], i) => {
                    const pct = Math.min((count / (stats.total || 1)) * 100, 100)
                    const colors = ['#7c3aed', '#3b82f6', '#0891b2', '#10b981', '#f59e0b']
                    return (
                      <div key={status} className="group">
                        <div className="flex justify-between mb-3">
                          <span className="text-[13px] font-black text-text-heading uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                            {status}
                          </span>
                          <span className="text-sm font-black text-text-heading">{count} <span className="text-text-muted font-medium">units</span></span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-brand-purple/5 overflow-hidden p-0.5 border border-brand-purple/5">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-8">
            {/* Active Asset Intelligence */}
            <article className="glass-card rounded-[40px] p-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-lg font-black text-text-heading">AI Audit</h2>
                </div>
                
                <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#1a1040] to-[#2d1b69] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  
                  <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/40">
                      Master Document
                    </p>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-xl font-black text-white leading-tight mb-2">
                          {activeResume?.version_name || 'No Asset'}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <p className="text-[11px] font-bold text-white/60">Ready for Matching</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                        <FileText size={22} />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">ATS Compatibility</p>
                        <p className="text-lg font-black text-white">{activeResume?.ats_score || '0'}%</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${activeResume?.ats_score || 0}%` }} />
                      </div>
                    </div>

                    <Link to={activeResume ? `/resumes/${activeResume.id}` : "/resumes"} className="w-full py-4 rounded-2xl bg-white text-brand-purple text-xs font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      View Intelligence <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-[32px] p-6 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Interviews</p>
                <p className="text-2xl font-black text-text-heading">{stats.by_status?.INTERVIEW || 0}</p>
              </div>
              <div className="glass-card rounded-[32px] p-6 text-center border-emerald-500/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Offers</p>
                <p className="text-2xl font-black text-emerald-600">{stats.by_status?.OFFER || 0}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
