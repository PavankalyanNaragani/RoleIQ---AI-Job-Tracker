import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { resumeAPI } from '../api/resumes'
import {
  CheckCircle, Clock, AlertCircle, ArrowLeft,
  ThumbsUp, ThumbsDown, AlertTriangle, Zap, ExternalLink, RefreshCcw, ShieldCheck, 
  FileText, Sparkles, Award, Target, Layout, LoaderCircle, Calendar
} from 'lucide-react'

const cardStyle = { 
  background: 'rgba(255, 255, 255, 0.8)', 
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(124,58,237,0.12)', 
  boxShadow: '0 8px 32px rgba(124,58,237,0.06)' 
}

function ATSRing({ score = 0 }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const valid = typeof score === 'number' ? score : 0
  const filled = (valid / 100) * circumference
  const color = valid >= 75 ? '#10b981' : valid >= 50 ? '#f59e0b' : '#ef4444'
  
  return (
    <div className="flex flex-col items-center justify-center relative group">
      <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full -z-10 group-hover:scale-110 transition-transform duration-700" />
      <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-sm">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f0ebff" strokeWidth="14" />
        <circle cx="80" cy="80" r={radius} fill="none" stroke="url(#scoreGradient)" strokeWidth="14"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          className="transition-all duration-1000 ease-out" />
        <text x="80" y="75" textAnchor="middle" fontSize="32" fontWeight="900" fill="#1a1040">{valid}</text>
        <text x="80" y="98" textAnchor="middle" fontSize="10" fontWeight="800" fill="#9589b8" className="uppercase tracking-[0.2em]">Score</text>
      </svg>
      <div className="mt-4 text-center">
        <p className="text-[13px] font-black text-text-heading">AI Match Probability</p>
        <div className="inline-flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <p className="text-[11px] font-bold text-text-muted">
            {valid >= 75 ? 'Optimal ATS Fit' : valid >= 50 ? 'Moderate Fit' : 'Requires Revision'}
          </p>
        </div>
      </div>
    </div>
  )
}

function SkillChip({ skill, variant = 'purple' }) {
  const map = {
    purple: { bg: '#f0ebff', border: 'rgba(124,58,237,0.2)', color: '#7c3aed' },
    green:  { bg: '#f0fdf4', border: 'rgba(16,185,129,0.2)', color: '#059669' },
    amber:  { bg: '#fffbeb', border: 'rgba(245,158,11,0.2)', color: '#d97706' },
    red:    { bg: '#fff1f1', border: 'rgba(239,68,68,0.2)',  color: '#dc2626' },
  }
  const s = map[variant]
  return (
    <span className="inline-flex items-center text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all hover:scale-105"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {skill}
    </span>
  )
}

function Panel({ title, icon, color = 'purple', children }) {
  return (
    <div className="rounded-[32px] p-8 overflow-hidden relative" style={cardStyle}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none`} />
      <div className="relative flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-text-heading">{title}</h3>
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

export default function ResumeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeAPI.get(id).then((r) => r.data),
    refetchInterval: (query) => {
      const r = query.state.data
      if (!r) return 2000
      const busy = r.parse_status === 'PROCESSING' || r.parse_status === 'PENDING'
        || r.analysis?.status === 'PROCESSING' || r.analysis?.status === 'PENDING'
      return busy ? 2000 : false
    },
  })

  const { mutate: reanalyze, isPending: reanalyzing } = useMutation({
    mutationFn: () => resumeAPI.reanalyze(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resume', id] }); toast.success('Re-analysis started') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const { mutate: activate, isPending: activating } = useMutation({
    mutationFn: () => resumeAPI.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', id] })
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Set as active resume')
    },
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="h-48 rounded-[32px] skeleton" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="h-96 rounded-[32px] skeleton" />
            <div className="lg:col-span-2 h-96 rounded-[32px] skeleton" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!resume) {
    return (
      <AppLayout>
        <div className="rounded-[32px] p-24 text-center bg-white border border-brand-purple/10">
          <AlertCircle size={48} className="text-brand-purple/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-heading mb-2">Resume Not Found</h2>
          <p className="text-text-muted mb-8 max-w-sm mx-auto">This resume may have been moved or deleted from your catalog.</p>
          <button onClick={() => navigate('/resumes')} className="btn-primary">Return to Catalog</button>
        </div>
      </AppLayout>
    )
  }

  const analysis = resume.analysis
  const isDone = analysis?.status === 'DONE'
  const isBusy = analysis?.status === 'PROCESSING' || analysis?.status === 'PENDING'
    || resume.parse_status === 'PROCESSING' || resume.parse_status === 'PENDING'

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto pb-12">
        {/* Navigation */}
        <button onClick={() => navigate('/resumes')}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-purple mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-brand-purple/10 group-hover:bg-brand-purple group-hover:text-white transition-all shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Back to Catalog
        </button>

        {/* Dynamic Header */}
        <div className="rounded-[32px] p-8 md:p-10 mb-8 relative overflow-hidden" 
          style={{ 
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #3b82f6 100%)',
            boxShadow: '0 12px 40px rgba(124, 58, 237, 0.25)' 
          }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-[24px] bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
                <FileText size={40} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-white tracking-tight">{resume.version_name}</h1>
                  {resume.is_active && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-400 text-emerald-950 border border-emerald-300/50 shadow-lg shadow-emerald-500/20">
                      <ShieldCheck size={12} /> Active Master
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Layout size={14} /> {resume.original_filename}</span>
                  {isDone && <span className="flex items-center gap-1.5"><Calendar size={14} /> Analyzed {new Date(analysis.analysed_at).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {resume.file_url && (
                <a href={resume.file_url} target="_blank" rel="noreferrer" 
                  className="px-6 py-3 rounded-2xl font-bold text-sm bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all">
                  <ExternalLink size={16} />
                </a>
              )}
              {!resume.is_active && (
                <button onClick={() => activate()} disabled={activating} 
                  className="px-6 py-3 rounded-2xl font-bold text-sm bg-white text-brand-purple shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  {activating ? <LoaderCircle size={18} className="animate-spin" /> : 'Set as Master'}
                </button>
              )}
              {isDone && (
                <button onClick={() => reanalyze()} disabled={reanalyzing} 
                  className="px-6 py-3 rounded-2xl font-bold text-sm bg-purple-950 text-white hover:bg-black transition-all">
                  <RefreshCcw size={16} className={reanalyzing ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Status Banners */}
        {isBusy && (
          <div className="rounded-[24px] p-6 mb-8 flex items-center gap-4 bg-blue-50 border border-blue-100 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-blue-900">
                {resume.parse_status !== 'DONE' ? 'Neural Text Extraction...' : 'Cognitive Skill Mapping...'}
              </p>
              <p className="text-[12px] text-blue-600 mt-0.5">Estimated completion: {resume.parse_status !== 'DONE' ? '12s' : '8s'}</p>
            </div>
          </div>
        )}

        {analysis?.status === 'FAILED' && (
          <div className="rounded-[24px] p-6 mb-8 flex items-center justify-between bg-red-50 border border-red-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-red-900">Analysis Halted</p>
                <p className="text-[12px] text-red-600 mt-0.5">{analysis.error_message || 'Structural extraction error'}</p>
              </div>
            </div>
            <button onClick={() => reanalyze()} className="btn-primary bg-red-600 hover:bg-red-700 shadow-red-500/20">Retry Analysis</button>
          </div>
        )}

        {/* Results Workspace */}
        {isDone && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Row: Score & High-level Feedback */}
            <div className="grid gap-8 lg:grid-cols-3 items-stretch">
              <div className="rounded-[32px] p-10 flex items-center justify-center" style={cardStyle}>
                <ATSRing score={analysis.ats_score} />
              </div>
              
              <div className="lg:col-span-2 rounded-[32px] p-10 relative overflow-hidden" style={cardStyle}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-text-heading">Strategic Feedback</h3>
                  </div>
                  
                  <p className="text-[15px] text-text-body leading-relaxed font-medium mb-8">
                    "{analysis.ats_feedback}"
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { val: analysis.skills_detected?.length || 0, label: 'Detected Skills', color: 'purple', icon: <Award size={14} /> },
                      { val: analysis.experience_years || 0,         label: 'Years Depth',   color: 'emerald', icon: <Target size={14} /> },
                      { val: analysis.formatting_issues?.length || 0, label: 'Audit Flags',   color: 'orange',  icon: <AlertTriangle size={14} /> },
                    ].map((m) => (
                      <div key={m.label} className="rounded-2xl p-4 flex flex-col gap-1 border border-black/5 bg-white shadow-sm">
                        <div className={`flex items-center gap-1.5 text-${m.color}-600 text-[10px] font-black uppercase tracking-widest`}>
                          {m.icon} {m.label}
                        </div>
                        <p className="text-3xl font-black text-text-heading">{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Panel */}
            <Panel title={`Semantic Skill Map`} icon={<Award size={20} />} color="purple">
              <div className="flex flex-wrap gap-2.5">
                {analysis.skills_detected?.map((s, i) => <SkillChip key={i} skill={s} variant="purple" />)}
              </div>
            </Panel>

            {/* SWOT-style Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              <Panel title="Structural Strengths" icon={<ThumbsUp size={20} />} color="emerald">
                <div className="space-y-4">
                  {analysis.strengths?.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                        <CheckCircle size={14} />
                      </div>
                      <p className="text-[13px] font-bold text-emerald-900 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </Panel>
              
              <Panel title="Growth Opportunities" icon={<ThumbsDown size={20} />} color="amber">
                <div className="space-y-4">
                  {analysis.weaknesses?.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                        <AlertTriangle size={14} />
                      </div>
                      <p className="text-[13px] font-bold text-amber-900 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Critical Formatting Alerts */}
            {analysis.formatting_issues?.length > 0 && (
              <Panel title="Technical Audit Alerts" icon={<AlertTriangle size={20} />} color="red">
                <div className="grid gap-4 md:grid-cols-2">
                  {analysis.formatting_issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                      <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                        <Zap size={16} />
                      </div>
                      <p className="text-[13px] font-bold text-red-900">{issue}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* Empty State / Not Started */}
        {!isDone && !isBusy && analysis?.status !== 'FAILED' && (
          <div className="rounded-[40px] p-24 text-center" style={cardStyle}>
            <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 flex items-center justify-center text-brand-purple mx-auto mb-6 shadow-inner">
              <Zap size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-text-heading mb-3">Intelligence Awaiting</h2>
            <p className="text-text-muted mb-8 max-w-sm mx-auto font-medium">Activate our AI engine to decode your resume's impact and ATS compatibility.</p>
            <button onClick={() => reanalyze()} className="btn-primary px-10 py-4 text-base">Initialize AI Analysis</button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}