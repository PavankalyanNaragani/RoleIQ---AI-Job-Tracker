import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle, ArrowLeft, CheckCircle, Clock, RefreshCcw, Save,
  Building2, Briefcase, Calendar, Globe, FileText, Layout, Sparkles,
  ExternalLink, ChevronRight, Target, Award, Info, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import { applicationsAPI } from '../api/applications'
import AppLayout from '../components/layout/AppLayout'

const STATUS_OPTIONS = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']
const SOURCE_OPTIONS = ['LinkedIn', 'Naukri', 'Company Website', 'Referral', 'Other']

const labelCls = 'block text-[11px] font-black uppercase tracking-[0.15em] text-text-muted mb-2 ml-1'

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsAPI.get(id).then((r) => r.data),
    refetchInterval: (query) => {
      const s = query.state.data?.latest_score?.status
      return s === 'PENDING' || s === 'PROCESSING' ? 2000 : false
    },
  })

  const currentForm = form || {
    company_name: application?.company_name || '',
    role_title: application?.role_title || '',
    source: application?.source || 'Other',
    status: application?.status || 'APPLIED',
    job_url: application?.job_url || '',
    applied_date: application?.applied_date || '',
    notes: application?.notes || '',
    jd_raw_text: application?.jd_raw_text || '',
  }

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['application', id] }),
    queryClient.invalidateQueries({ queryKey: ['applications'] }),
  ])

  const updateMutation = useMutation({
    mutationFn: (p) => applicationsAPI.update(id, p),
    onSuccess: async () => { toast.success('Evolution synced.'); setForm(null); await refresh() },
    onError: () => toast.error('Sync failed'),
  })

  const rescoreMutation = useMutation({
    mutationFn: () => applicationsAPI.rescore(id),
    onSuccess: async () => { toast.success('Scoring initialized.'); await refresh() },
    onError: (e) => toast.error(e.response?.data?.error || 'Could not initialize scoring'),
  })

  const missingSkillsMutation = useMutation({
    mutationFn: (skills) => applicationsAPI.updateMissingSkills(id, skills),
    onSuccess: async () => { toast.success('Intelligence gap updated.'); await refresh() },
    onError: () => toast.error('Update failed'),
  })

  const handleChange = (e) => setForm((c) => ({ ...(c || currentForm), [e.target.name]: e.target.value }))
  const handleSubmit = (e) => { e.preventDefault(); updateMutation.mutate(currentForm) }

  const score = application?.latest_score
  const shownMissing = score?.user_edited_missing || score?.missing_skills || []
  const [missingText, setMissingText] = useState('')
  const missingValue = missingText || shownMissing.join(', ')

  const saveMissing = () => {
    const skills = missingValue.split(',').map((s) => s.trim()).filter(Boolean)
    missingSkillsMutation.mutate(skills)
  }

  const scoreColor = score?.score >= 80 ? '#10b981' : score?.score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link to="/applications" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={16} /> Back to Pipeline
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-text-heading">Tracking Active</span>
            </div>
            {application?.job_url && (
              <a href={application.job_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white border border-brand-purple/10 flex items-center justify-center text-brand-purple hover:bg-brand-purple hover:text-white transition-all shadow-sm">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="h-[800px] rounded-[40px] skeleton" />
            <div className="space-y-8">
              <div className="h-64 rounded-[40px] skeleton" />
              <div className="h-96 rounded-[40px] skeleton" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
            
            {/* Left: Tactical Management */}
            <div className="space-y-8">
              <section className="glass-card rounded-[40px] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                
                <div className="relative mb-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-xl shadow-brand-purple/10">
                      <Briefcase size={28} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-purple mb-1">
                        {application.company_name}
                      </p>
                      <h1 className="text-3xl font-black text-text-heading tracking-tight leading-tight">
                        {application.role_title}
                      </h1>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={labelCls}>Company Identifier</label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="text" name="company_name" value={currentForm.company_name}
                          onChange={handleChange} className="form-input pl-12 focus:border-brand-purple focus:ring-brand-purple/5" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>Role Specification</label>
                      <div className="relative">
                        <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="text" name="role_title" value={currentForm.role_title}
                          onChange={handleChange} className="form-input pl-12 focus:border-brand-purple focus:ring-brand-purple/5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className={labelCls}>Pipeline Status</label>
                      <div className="relative">
                        <Layout size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        <select name="status" value={currentForm.status} onChange={handleChange} className="form-input pl-12 appearance-none focus:border-brand-purple focus:ring-brand-purple/5">
                          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>Origin Source</label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        <select name="source" value={currentForm.source} onChange={handleChange} className="form-input pl-12 appearance-none focus:border-brand-purple focus:ring-brand-purple/5">
                          {SOURCE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>Engagement Date</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="date" name="applied_date" value={currentForm.applied_date}
                          onChange={handleChange} className="form-input pl-12 focus:border-brand-purple focus:ring-brand-purple/5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>Resource Link</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="url" name="job_url" value={currentForm.job_url}
                        onChange={handleChange} className="form-input pl-12 focus:border-brand-purple focus:ring-brand-purple/5" placeholder="https://..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>Operational Notes</label>
                    <textarea name="notes" value={currentForm.notes} onChange={handleChange}
                      rows={4} className="form-input resize-none p-5" placeholder="Add tactical notes here..." />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelCls}>JD Specification Snapshot</label>
                      {application.jd_summary && (
                        <Link to={`/job-descriptions/${application.jd_summary.id}`} className="text-[10px] font-black uppercase tracking-widest text-brand-purple flex items-center gap-1 hover:underline">
                          View Linked Library Item <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                    <textarea name="jd_raw_text" value={currentForm.jd_raw_text} onChange={handleChange}
                      rows={8} className="form-input resize-none p-5 text-[13px] leading-relaxed bg-[#fafafa]" placeholder="Paste JD for AI matching..." />
                  </div>

                  <div className="pt-6 border-t border-brand-purple/5 flex gap-4">
                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary px-10 py-4 shadow-xl shadow-brand-purple/20">
                      <Save size={18} /> {updateMutation.isPending ? 'Syncing...' : 'Sync Evolution'}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            {/* Right: AI Intelligence & Meta */}
            <aside className="space-y-8 sticky top-8">
              
              {/* Score Intelligence */}
              <section className="glass-card rounded-[40px] p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-center justify-between mb-8 relative">
                  <div>
                    <h2 className="text-lg font-black text-text-heading tracking-tight">AI Match Profile</h2>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">Automated compatibility audit</p>
                  </div>
                  <button onClick={() => rescoreMutation.mutate()} disabled={rescoreMutation.isPending}
                    className="w-10 h-10 rounded-xl bg-brand-purple/5 flex items-center justify-center text-brand-purple hover:bg-brand-purple hover:text-white transition-all">
                    <RefreshCcw size={16} className={rescoreMutation.isPending ? 'animate-spin' : ''} />
                  </button>
                </div>

                {!score && (
                  <div className="rounded-3xl p-8 text-center border-2 border-dashed border-brand-purple/10 bg-brand-purple/5">
                    <Sparkles size={32} className="mx-auto mb-4 text-brand-purple/20" />
                    <p className="text-sm font-bold text-text-heading">No Profile Yet</p>
                    <p className="text-[11px] text-text-muted mt-2">Initialize scoring to map your active resume against this specification.</p>
                    <button onClick={() => rescoreMutation.mutate()} className="mt-6 w-full py-3 rounded-2xl bg-brand-purple text-white text-xs font-black shadow-lg shadow-brand-purple/20">
                      Initialize Audit
                    </button>
                  </div>
                )}

                {(score?.status === 'PENDING' || score?.status === 'PROCESSING') && (
                  <div className="rounded-3xl p-8 flex flex-col items-center text-center bg-blue-50/50 border border-blue-100">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-6" />
                    <h3 className="text-lg font-black text-blue-700 mb-2">Analyzing Synapses</h3>
                    <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Page will sync automatically</p>
                  </div>
                )}

                {score?.status === 'FAILED' && (
                  <div className="rounded-3xl p-8 bg-red-50 border border-red-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white">
                        <AlertCircle size={20} />
                      </div>
                      <h3 className="text-lg font-black text-red-700">Audit Interrupted</h3>
                    </div>
                    <p className="text-[12px] text-red-600 leading-relaxed mb-6">
                      {score.error_message || 'The AI engine encountered an anomaly during synthesis.'}
                    </p>
                    <button onClick={() => rescoreMutation.mutate()} className="w-full py-3 rounded-xl bg-red-500 text-white text-xs font-black shadow-lg shadow-red-500/20">
                      Retry Synthesis
                    </button>
                  </div>
                )}

                {score?.status === 'DONE' && (
                  <div className="space-y-8 animate-fade-in">
                    {/* Hero Score */}
                    <div className="relative p-10 rounded-[32px] bg-gradient-to-br from-[#1a1040] to-[#2d1b69] shadow-2xl overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <div className="relative text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/40">Compatibility Index</p>
                        <div className="text-7xl font-black mb-2 flex items-center justify-center gap-1" style={{ color: scoreColor }}>
                          {score.score}
                          <span className="text-2xl text-white/20 mt-4">%</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                          <Zap size={10} className="text-amber-400" />
                          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Conf: {score.confidence}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="p-6 rounded-[24px] bg-white border border-brand-purple/10 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={14} className="text-brand-purple" />
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-text-heading">Strategic Summary</h3>
                      </div>
                      <p className="text-[13px] leading-relaxed text-text-muted font-medium italic">
                        "{score.summary}"
                      </p>
                    </div>

                    {/* Skills Grid */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4 ml-1">Matched Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                          {score.matched_skills?.length
                            ? score.matched_skills.map((s) => (
                                <span key={s} className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                  {s}
                                </span>
                              ))
                            : <span className="text-[12px] text-text-muted italic ml-1">No overlap detected.</span>}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4 ml-1">Missing Components</h3>
                        <textarea value={missingValue} onChange={(e) => setMissingText(e.target.value)}
                          rows={3} className="form-input resize-none text-[12px] font-bold p-4 bg-red-50/30 border-red-100 focus:border-red-500 focus:ring-red-50" />
                        <button onClick={saveMissing} disabled={missingSkillsMutation.isPending}
                          className="w-full mt-3 py-3 rounded-xl bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                          {missingSkillsMutation.isPending ? 'Syncing...' : 'Sync Intelligence Gap'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Data Snapshot */}
              <section className="glass-card rounded-[40px] p-8">
                <h2 className="text-lg font-black text-text-heading tracking-tight mb-6">Data Snapshot</h2>
                <div className="space-y-1">
                  {[
                    ['Origin', application.source, Globe, 'blue'],
                    ['State', application.status, Layout, 'purple'],
                    ['Library', application.jd_summary ? 'Verified' : 'Direct', FileText, 'emerald'],
                    ['Confidence', score?.confidence ? `${score.confidence}%` : '--', Award, 'amber'],
                  ].map(([key, val, Icon, color]) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-brand-purple/5 last:border-0 group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center text-${color}-600 transition-transform group-hover:scale-110`}>
                          <Icon size={14} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">{key}</span>
                      </div>
                      <span className="text-[13px] font-black text-text-heading">{val}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
