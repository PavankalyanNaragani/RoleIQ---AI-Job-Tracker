import { useQuery } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { analyticsAPI } from '../api/analytics'
import { BarChart3, TrendingUp, Filter, Sparkles, Award, Target, Activity } from 'lucide-react'

const SOURCE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4']

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(124,58,237,0.18)',
    borderRadius: 16,
    boxShadow: '0 20px 40px rgba(124,58,237,0.1)',
    color: '#1a1040',
    fontSize: 12,
    fontWeight: 'bold',
  },
  labelStyle: { color: '#7c3aed', fontWeight: 900, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' },
}

function ChartCard({ title, icon: Icon, color = 'purple', children }) {
  return (
    <article className="glass-card rounded-[32px] p-8 overflow-hidden relative transition-all duration-300 hover:border-brand-purple/30 group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform pointer-events-none`} />
      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
            {Icon}
          </div>
          <h2 className="text-xl font-black text-text-heading tracking-tight">{title}</h2>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-purple/20" />
          <div className="w-2 h-2 rounded-full bg-brand-purple/10" />
        </div>
      </div>
      <div className="mt-4 h-[300px] relative">{children}</div>
    </article>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const [funnel, velocity, skillGaps, responseRate, sources, scoreDistribution] = await Promise.all([
        analyticsAPI.funnel(), analyticsAPI.velocity(), analyticsAPI.skillGaps(),
        analyticsAPI.responseRate(), analyticsAPI.sources(), analyticsAPI.scoreDistribution(),
      ])
      return {
        funnel: funnel.data.funnel || [],
        velocity: velocity.data.velocity || [],
        skillGaps: skillGaps.data.top_gaps || [],
        responseRate: responseRate.data.response_rate || 0,
        sources: sources.data.sources || [],
        scoreDistribution: scoreDistribution.data.score_distribution || [],
      }
    },
  })

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <section className="page-header mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-4">
                <BarChart3 size={12} /> Strategic Insight
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Performance Analytics</h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Decoding funnel velocity, technical gaps, and market positioning.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-8 py-4 rounded-[32px] border border-white/20 shadow-2xl">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Conversion Velocity</p>
                <p className="text-3xl font-black text-white">
                  {isLoading ? '--' : `${data?.responseRate ?? 0}%`}
                </p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-500/20">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </section>

        {/* Filters/Toolbar */}
        <div className="flex gap-4 mb-8">
          <button className="px-6 py-4 rounded-2xl bg-white border border-brand-purple/10 text-text-muted hover:text-brand-purple hover:border-brand-purple transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
            <Filter size={16} /> Date Range: Last 90 Days
          </button>
          <button className="px-6 py-4 rounded-2xl bg-white border border-brand-purple/10 text-text-muted hover:text-brand-purple hover:border-brand-purple transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
            <Sparkles size={16} /> Compare Masters
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-8 xl:grid-cols-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-[450px] rounded-[40px] skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-2">
            <ChartCard title="Funnel Saturation" icon={<Activity size={20} />} color="purple">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.funnel || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.08)" />
                  <XAxis dataKey="status" stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="url(#purpleGradient)" radius={[8,8,0,0]} barSize={40}>
                    <defs>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Growth Velocity" icon={<TrendingUp size={20} />} color="blue">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.velocity || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.08)" />
                  <XAxis dataKey="week_label" stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, shadow: '0 0 10px rgba(59,130,246,0.5)' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Critical Skill Gaps" icon={<Target size={20} />} color="red">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.skillGaps || []} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(124,58,237,0.08)" />
                  <XAxis type="number" stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="skill" type="category" stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: 20 }} />
                  <Bar dataKey="frequency" name="Market Demand" fill="#7c3aed" radius={[0,8,8,0]} barSize={20} />
                  <Bar dataKey="rejection_correlation" name="Friction Level" fill="#ef4444" radius={[0,8,8,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Market Origin" icon={<Award size={20} />} color="emerald">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.sources || []} dataKey="count" nameKey="source"
                    cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={8} cornerRadius={8}>
                    {(data?.sources || []).map((entry, i) => (
                      <Cell key={entry.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: 20 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="xl:col-span-2">
              <ChartCard title="AI Score Distribution" icon={<Sparkles size={20} />} color="blue">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.scoreDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.08)" />
                    <XAxis dataKey="bucket" stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#9589b8" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8,8,0,0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
