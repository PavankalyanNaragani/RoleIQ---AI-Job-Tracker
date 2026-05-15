import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCcw, Search, Sparkles, LoaderCircle, Award, Target, Layout, Briefcase, ChevronRight, Zap, ArrowRight, ExternalLink, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { jobDescriptionAPI } from '../api/jobDescriptions'
import { recommendationsAPI } from '../api/recommendations'
import { resumeAPI } from '../api/resumes'

function scoreStyle(score) {
  if (score >= 80) return { bg: '#f0fdf4', border: 'rgba(16,185,129,0.3)', color: '#059669', label: 'High Potential' }
  if (score >= 60) return { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)', color: '#d97706', label: 'Solid Match' }
  return { bg: '#fff1f1', border: 'rgba(239,68,68,0.3)', color: '#dc2626', label: 'Moderate Fit' }
}

export default function JobRecommendationsPage() {
  const queryClient = useQueryClient()
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [selectedJdId, setSelectedJdId] = useState('')
  const [activeRecommendationId, setActiveRecommendationId] = useState(null)

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list().then((r) => r.data?.results ?? r.data),
  })
  const { data: jobDescriptions = [] } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => jobDescriptionAPI.list().then((r) => r.data?.results ?? r.data),
  })
  const { data: recommendationHistory = [] } = useQuery({
    queryKey: ['job-recommendations-history'],
    queryFn: () => recommendationsAPI.list().then((r) => r.data),
  })

  useEffect(() => {
    if (!selectedResumeId && resumes.length > 0) {
      const active = resumes.find((r) => r.is_active) || resumes[0]
      setSelectedResumeId(String(active.id))
    }
  }, [resumes, selectedResumeId])

  useEffect(() => {
    if (!activeRecommendationId && recommendationHistory.length > 0)
      setActiveRecommendationId(recommendationHistory[0].id)
  }, [recommendationHistory, activeRecommendationId])

  const { data: activeRecommendation, isLoading: isRecLoading } = useQuery({
    queryKey: ['job-recommendation', activeRecommendationId],
    queryFn: () => recommendationsAPI.get(activeRecommendationId).then((r) => r.data),
    enabled: Boolean(activeRecommendationId),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'PENDING' || s === 'PROCESSING' ? 2000 : false
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => recommendationsAPI.create(payload),
    onSuccess: async (res) => {
      setActiveRecommendationId(res.data.id)
      await queryClient.invalidateQueries({ queryKey: ['job-recommendations-history'] })
      toast.success('Recommendations queued.')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not generate'),
  })

  const retryMutation = useMutation({
    mutationFn: (id) => recommendationsAPI.retry(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job-recommendation', activeRecommendationId] }),
        queryClient.invalidateQueries({ queryKey: ['job-recommendations-history'] }),
      ])
      toast.success('Queued again.')
    },
    onError: () => toast.error('Could not retry'),
  })

  const selectedResume = useMemo(
    () => resumes.find((r) => String(r.id) === String(selectedResumeId)),
    [resumes, selectedResumeId]
  )

  const startRecommendations = () => {
    if (!selectedResumeId) { toast.error('Select a resume first.'); return }
    createMutation.mutate({ resume_id: Number(selectedResumeId), jd_id: selectedJdId ? Number(selectedJdId) : null })
  }

  const recommendations = activeRecommendation?.recommended_jobs || []
  const status = activeRecommendation?.status
  const selectCls = 'form-input appearance-none cursor-pointer pr-10'

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <section className="page-header mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-4">
                <Sparkles size={12} /> Predictive Analytics
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">AI Job Recommendations</h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Targeted role surfacing based on your active professional assets.
              </p>
            </div>
            {recommendationHistory.length > 0 && (
              <div className="flex gap-2">
                {recommendationHistory.slice(0, 3).map((h) => (
                  <button key={h.id} onClick={() => setActiveRecommendationId(h.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeRecommendationId === h.id ? 'bg-white text-brand-purple shadow-xl scale-110' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>
                    <Award size={18} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tactical Controls */}
        <div className="glass-card rounded-[32px] p-8 mb-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1fr_240px]">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                <Award size={10} className="text-brand-purple" /> Active Asset
              </label>
              <div className="relative">
                <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className={selectCls}>
                  <option value="">Select Target Resume</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.version_name}{r.is_active ? ' (Master)' : ''}</option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                <Layout size={10} className="text-brand-purple" /> Context Alignment (Optional)
              </label>
              <div className="relative">
                <select value={selectedJdId} onChange={(e) => setSelectedJdId(e.target.value)} className={selectCls}>
                  <option value="">General Market Fit</option>
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>{jd.company_name} — {jd.title}</option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90" />
              </div>
            </div>

            <div className="flex items-end">
              <button onClick={startRecommendations} disabled={createMutation.isPending} 
                className="btn-primary w-full py-4 rounded-2xl justify-center gap-2">
                {createMutation.isPending ? <><LoaderCircle size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Surface Roles</>}
              </button>
            </div>
          </div>
          
          {selectedResume && (
            <div className="mt-6 flex items-center gap-4 px-4 py-3 rounded-2xl bg-brand-purple/5 border border-brand-purple/10">
              <div className="w-8 h-8 rounded-lg bg-white border border-brand-purple/10 flex items-center justify-center text-brand-purple">
                <Award size={14} />
              </div>
              <p className="text-[12px] font-bold text-text-heading">
                Syncing analysis with <span className="text-brand-purple">{selectedResume.version_name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Intelligence Output */}
        <section className="space-y-8">
          {(status === 'PENDING' || status === 'PROCESSING') && (
            <div className="glass-card rounded-[32px] p-12 flex flex-col items-center text-center bg-blue-50/30 border-blue-100">
              <div className="w-20 h-20 rounded-full border-[6px] border-blue-500 border-t-transparent animate-spin mb-8 shadow-xl shadow-blue-500/20" />
              <h2 className="text-2xl font-black text-blue-700 tracking-tight">Synthesizing Recommendations</h2>
              <p className="text-[13px] font-bold text-blue-500 uppercase tracking-widest mt-2">Correlating skills with global market demand</p>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="glass-card rounded-[32px] p-12 bg-red-50 border-red-100 text-center">
              <div className="w-16 h-16 rounded-[24px] bg-red-500 flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-red-500/20">
                <Zap size={32} />
              </div>
              <h2 className="text-2xl font-black text-red-700 tracking-tight mb-2">Synthesis Interrupted</h2>
              <p className="text-[13px] text-red-500 mb-8 max-w-md mx-auto">{activeRecommendation?.error_message || 'The AI engine encountered an anomaly.'}</p>
              <button onClick={() => retryMutation.mutate(activeRecommendation.id)}
                disabled={retryMutation.isPending}
                className="btn-primary bg-red-500 hover:bg-red-600 px-10 py-4 shadow-xl shadow-red-500/20">
                <RefreshCcw size={18} /> Re-initialize Run
              </button>
            </div>
          )}

          {status === 'DONE' && recommendations.length > 0 && (
            <div className="grid gap-8 xl:grid-cols-2">
              {recommendations.map((item, i) => {
                const s = scoreStyle(item.match_score)
                return (
                  <article key={`${item.title}-${i}`} className="glass-card rounded-[40px] p-10 group relative transition-all duration-300 hover:border-brand-purple/30 hover:shadow-2xl hover:shadow-brand-purple/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
                    
                    <div className="relative mb-8 flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                            <Briefcase size={16} />
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">{item.company_type}</p>
                        </div>
                        <h2 className="text-2xl font-black text-text-heading tracking-tight leading-tight group-hover:text-brand-purple transition-colors">{item.title}</h2>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="text-4xl font-black tracking-tighter" style={{ color: s.color }}>{item.match_score}<span className="text-sm opacity-30">%</span></span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-6 rounded-3xl bg-[#fafafa] border border-black/5 mb-8">
                      <p className="text-[14px] leading-relaxed text-text-body font-medium italic">"{item.match_reason}"</p>
                    </div>

                    <div className="relative grid gap-8 md:grid-cols-2 mb-8">
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4 flex items-center gap-2">
                          <Zap size={12} /> Strategic Advantage
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(item.key_skills_to_highlight || []).map((skill) => (
                            <span key={skill} className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-4 flex items-center gap-2">
                          <Target size={12} /> Intelligence Gaps
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(item.skill_gaps_to_address || []).map((skill) => (
                            <span key={skill} className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-8 border-t border-brand-purple/5 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Suggested Market Query</p>
                        <div className="flex items-center gap-3">
                          <code className="text-[13px] font-bold text-brand-purple bg-brand-purple/5 px-3 py-1 rounded-lg border border-brand-purple/10">{item.suggested_search_query}</code>
                        </div>
                      </div>
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(item.suggested_search_query + " jobs")}`} 
                        target="_blank" rel="noreferrer" 
                        className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-brand-purple/20">
                        <Globe size={20} />
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {!activeRecommendation && !isRecLoading && (
            <div className="glass-card rounded-[40px] p-24 text-center border-2 border-dashed border-brand-purple/10 bg-brand-purple/5">
              <div className="w-24 h-24 rounded-[32px] bg-white border border-brand-purple/10 flex items-center justify-center text-brand-purple/20 mx-auto mb-8 shadow-inner">
                <Sparkles size={48} />
              </div>
              <h2 className="text-2xl font-black text-text-heading mb-4 tracking-tight">Oracle Inactive</h2>
              <p className="text-sm text-text-muted max-w-md mx-auto font-medium mb-10">Select your master resume and an optional context specification to generate high-fidelity job recommendations.</p>
              <button onClick={startRecommendations} className="btn-primary px-10 py-4 shadow-xl shadow-brand-purple/30">
                Initialize Recommender <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
