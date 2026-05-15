import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, RefreshCcw, Sparkles, LoaderCircle, ArrowRight, FileText, Layout, ChevronRight, Zap, Target, Award, Info, Edit3, Save, User, Mail, Phone, Globe, Link2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { jobDescriptionAPI } from '../api/jobDescriptions'
import { resumeAPI } from '../api/resumes'
import { resumeGenerationAPI } from '../api/resumeGeneration'
import AppLayout from '../components/layout/AppLayout'

const STEPS = ['summary', 'work_experience', 'skills', 'education_projects', 'done']
const STEP_LABELS = {
  summary: 'Tactical Summary', 
  work_experience: 'Professional Evolution',
  skills: 'Technical Matrix', 
  education_projects: 'Knowledge Assets', 
  done: 'Final Synthesis',
}

function stepStatus(currentCheckpoint, status, step) {
  if (status === 'DONE' && step === 'done') return 'done'
  if (step === currentCheckpoint) return 'current'
  const ci = STEPS.indexOf(currentCheckpoint), si = STEPS.indexOf(step)
  if (status === 'DONE' && si < STEPS.length - 1) return 'done'
  if (ci > si && si >= 0) return 'done'
  return 'pending'
}

const labelCls = 'text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 ml-1 block'

export default function ResumeGeneratorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState('existing')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [selectedJdId, setSelectedJdId] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [profileInput, setProfileInput] = useState({
    name: '', email: '', phone: '', linkedin: '', github: '', experience_description: '',
  })

  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: () => resumeAPI.list().then((r) => r.data?.results ?? r.data) })
  const { data: jobDescriptions = [] } = useQuery({ queryKey: ['job-descriptions'], queryFn: () => jobDescriptionAPI.list().then((r) => r.data?.results ?? r.data) })
  const { data: runs = [] } = useQuery({ queryKey: ['resume-generations'], queryFn: () => resumeGenerationAPI.list().then((r) => r.data) })

  const activeId = id || (runs[0] ? String(runs[0].id) : null)
  const { data: run } = useQuery({
    queryKey: ['resume-generation', activeId],
    queryFn: () => resumeGenerationAPI.get(activeId).then((r) => r.data),
    enabled: Boolean(activeId),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'PENDING' || s === 'PROCESSING' ? 2000 : false
    },
  })

  const selectedResume = useMemo(() => {
    if (!selectedResumeId) return resumes.find((r) => r.is_active) || resumes[0]
    return resumes.find((r) => String(r.id) === selectedResumeId)
  }, [resumes, selectedResumeId])

  const createMutation = useMutation({
    mutationFn: (p) => resumeGenerationAPI.create(p),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['resume-generations'] })
      navigate(`/resume-generator/${res.data.id}`)
      toast.success('Resume Synthesis initiated.')
    },
    onError: (e) => toast.error(e.response?.data?.error || e.response?.data?.non_field_errors?.[0] || 'Synthesis initialization failed'),
  })

  const approveMutation = useMutation({
    mutationFn: ({ runId, section, content }) => resumeGenerationAPI.approve(runId, { section, content }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['resume-generation', activeId] }),
        queryClient.invalidateQueries({ queryKey: ['resume-generations'] }),
      ])
      setEditedContent('')
      toast.success('Section verified. Progressing...')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Verification failed'),
  })

  const regenerateMutation = useMutation({
    mutationFn: (runId) => resumeGenerationAPI.regenerate(runId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['resume-generation', activeId] }); toast.success('Regeneration queued.') },
    onError: () => toast.error('Regeneration failed'),
  })

  const startRun = () => {
    const payload = { jd_id: selectedJdId ? Number(selectedJdId) : null, profile_input: profileInput }
    if (mode === 'existing') {
      if (!selectedResume?.id) { toast.error('Select a resume first.'); return }
      payload.resume_id = selectedResume.id
    } else { payload.resume_id = null }
    createMutation.mutate(payload)
  }

  const downloadResume = async () => {
    try {
      const res = await resumeGenerationAPI.download(run.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/plain' }))
      const a = document.createElement('a')
      a.href = url; a.download = `resume_${run.id}.txt`
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const reviewContent = editedContent || run?.generated_content || ''

  const pInput = (field) => ({
    value: profileInput[field],
    onChange: (e) => setProfileInput((prev) => ({ ...prev, [field]: e.target.value })),
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
                <Sparkles size={12} /> Optimization Engine
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">AI Resume Optimizer</h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                ATS-driven professional synthesis with multi-stage human verification.
              </p>
            </div>
            {runs.length > 0 && !activeId && (
              <div className="flex gap-2">
                {runs.slice(0, 3).map((r) => (
                  <button key={r.id} onClick={() => navigate(`/resume-generator/${r.id}`)}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <FileText size={18} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Setup Phase */}
        {!activeId && (
          <div className="glass-card rounded-[40px] p-10 relative overflow-hidden group space-y-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
            
            <div className="relative flex flex-col md:flex-row gap-4">
              {['existing', 'scratch'].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 px-8 py-5 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-purple text-white shadow-xl shadow-purple/20' : 'bg-purple/5 text-purple border border-purple/10 hover:bg-purple/10'}`}>
                  {m === 'existing' ? 'Optimize Existing' : 'Forge From Scratch'}
                </button>
              ))}
            </div>

            <div className="relative grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-text-heading tracking-tight mb-4 flex items-center gap-2">
                  <User size={20} className="text-brand-purple" /> Identity Payload
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelCls}>Full Identifier</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" placeholder="Jane Smith" className="form-input pl-12" {...pInput('name')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Direct Comms</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="email" placeholder="jane@company.com" className="form-input pl-12" {...pInput('email')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Voice Sync</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" placeholder="+1 234 567 8900" className="form-input pl-12" {...pInput('phone')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Professional HQ</label>
                    <div className="relative">
                      <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="url" placeholder="linkedin.com/in/jane" className="form-input pl-12" {...pInput('linkedin')} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Open Source Signature</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="url" placeholder="github.com/jane" className="form-input pl-12" {...pInput('github')} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-black text-text-heading tracking-tight mb-4 flex items-center gap-2">
                  <Target size={20} className="text-brand-purple" /> Professional Trajectory
                </h3>
                <div className="space-y-2">
                  <label className={labelCls}>Raw Experience Narrative</label>
                  <textarea rows={10} placeholder="Roles, achievements, projects, tools, impact..."
                    className="form-input resize-none p-5 text-[13px] leading-relaxed" {...pInput('experience_description')} />
                </div>
              </div>
            </div>

            <div className="relative pt-10 border-t border-purple/5 grid gap-8 lg:grid-cols-[1fr_1fr_240px]">
              {mode === 'existing' ? (
                <div className="space-y-2">
                  <label className={labelCls}>Base Professional Asset</label>
                  <div className="relative">
                    <select value={selectedResumeId || String(selectedResume?.id || '')}
                      onChange={(e) => setSelectedResumeId(e.target.value)} className="form-input appearance-none pr-10">
                      <option value="">Select Target Resume</option>
                      {resumes.map((r) => <option key={r.id} value={r.id}>{r.version_name}{r.is_active ? ' (Master)' : ''}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90" />
                  </div>
                </div>
              ) : <div />}

              <div className="space-y-2">
                <label className={labelCls}>Context Alignment (Optional)</label>
                <div className="relative">
                  <select value={selectedJdId} onChange={(e) => setSelectedJdId(e.target.value)} className="form-input appearance-none pr-10">
                    <option value="">General Professional Fit</option>
                    {jobDescriptions.map((jd) => <option key={jd.id} value={jd.id}>{jd.company_name} — {jd.title}</option>)}
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted rotate-90" />
                </div>
              </div>

              <div className="flex items-end">
                <button onClick={startRun} disabled={createMutation.isPending} 
                  className="btn-primary w-full py-4 rounded-2xl justify-center gap-2">
                  {createMutation.isPending ? <><LoaderCircle size={18} className="animate-spin" /> Initializing...</> : <><Sparkles size={18} /> Start Optimization</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Execution Phase */}
        {activeId && run && (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
            
            {/* Editor Console */}
            <div className="space-y-8">
              {/* Process Visualization */}
              <div className="glass-card rounded-[32px] p-6">
                <div className="flex items-center gap-1">
                  {STEPS.map((step, idx) => {
                    const s = stepStatus(run.current_checkpoint, run.status, step)
                    return (
                      <div key={step} className="flex-1 flex items-center gap-1 group">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${s === 'done' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : s === 'current' ? 'bg-brand-purple animate-pulse' : 'bg-brand-purple/5'}`} />
                        {idx < STEPS.length - 1 && <div className="w-1 h-1 rounded-full bg-brand-purple/10" />}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-4 px-1">
                  {STEPS.map((step) => {
                    const s = stepStatus(run.current_checkpoint, run.status, step)
                    return (
                      <div key={step} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${s === 'current' ? 'text-brand-purple' : s === 'done' ? 'text-emerald-600' : 'text-text-muted/40'}`}>
                        {STEP_LABELS[step].split(' ')[0]}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status Indicator */}
              {(run.status === 'PENDING' || run.status === 'PROCESSING') && (
                <div className="glass-card rounded-[40px] p-16 flex flex-col items-center text-center bg-blue-50/30 border-blue-100">
                  <div className="w-20 h-20 rounded-full border-[6px] border-blue-500 border-t-transparent animate-spin mb-8 shadow-xl shadow-blue-500/20" />
                  <h2 className="text-2xl font-black text-blue-700 tracking-tight">Optimizing {STEP_LABELS[run.current_checkpoint]}</h2>
                  <p className="text-[13px] font-bold text-blue-500 uppercase tracking-widest mt-2">ATS Pattern Matching in progress...</p>
                </div>
              )}

              {run.status === 'FAILED' && (
                <div className="glass-card rounded-[40px] p-16 bg-red-50 border-red-100 text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-red-500 flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-red-500/20">
                    <Zap size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-red-700 tracking-tight mb-2">Optimization Failed</h2>
                  <p className="text-[13px] text-red-500 mb-8 max-w-md mx-auto">{run.error_message || 'Unexpected failure.'}</p>
                  <button onClick={() => regenerateMutation.mutate(run.id)}
                    className="btn-primary bg-red-500 hover:bg-red-600 px-10 py-4">
                    <RefreshCcw size={18} /> Retry Run
                  </button>
                </div>
              )}

              {/* Editor Shell */}
              {run.status === 'AWAITING_REVIEW' && (
                <div className="glass-card rounded-[40px] overflow-hidden border-brand-purple/20 shadow-2xl">
                  <div className="px-10 py-6 bg-brand-purple/5 border-b border-brand-purple/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/20">
                        <Edit3 size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-text-heading tracking-tight">{STEP_LABELS[run.current_checkpoint]}</h2>
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">ATS Compliance Review</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => regenerateMutation.mutate(run.id)} disabled={regenerateMutation.isPending}
                        className="w-10 h-10 rounded-xl bg-white border border-brand-purple/10 flex items-center justify-center text-brand-purple hover:bg-brand-purple hover:text-white transition-all shadow-sm">
                        <RefreshCcw size={16} className={regenerateMutation.isPending ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-[#1a1040]">
                    <textarea
                      value={reviewContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={18}
                      className="w-full bg-transparent border-0 text-purple-100 font-mono text-[14px] leading-relaxed p-8 focus:ring-0 resize-none custom-scrollbar"
                      style={{ caretColor: '#7c3aed' }}
                    />
                  </div>

                  <div className="px-10 py-8 bg-white border-t border-brand-purple/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-text-muted">
                      <Info size={16} />
                      <p className="text-[12px] font-medium italic">Content verified against ATS keyword density.</p>
                    </div>
                    <button
                      onClick={() => approveMutation.mutate({ runId: run.id, section: run.current_checkpoint, content: reviewContent })}
                      disabled={approveMutation.isPending} className="btn-primary px-10 py-4 shadow-xl shadow-brand-purple/20">
                      <Save size={18} /> {approveMutation.isPending ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Shell */}
              {run.status === 'DONE' && (
                <div className="glass-card rounded-[40px] p-12 bg-emerald-50/50 border-emerald-100 text-center animate-scale-in">
                  <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
                    <Award size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-emerald-800 tracking-tight mb-4">Optimization Complete!</h2>
                  <p className="text-sm text-emerald-600 max-w-md mx-auto font-medium mb-12">Your ATS-optimized resume has been synthesized and is ready for market deployment.</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={downloadResume}
                      className="px-12 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                      <Download size={20} /> Download Master (.txt)
                    </button>
                    <button onClick={() => navigate('/resume-generator')} className="px-8 py-4 rounded-2xl bg-white border border-emerald-100 text-emerald-600 font-black text-sm hover:bg-emerald-50 transition-all">
                      Start New Optimization
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Sidebar */}
            <aside className="space-y-8 sticky top-8">
              {/* Current Context */}
              <section className="glass-card rounded-[40px] p-8">
                <h3 className="text-lg font-black text-text-heading tracking-tight mb-6">Asset Context</h3>
                <div className="space-y-4">
                  {STEPS.slice(0, -1).map((step) => {
                    const content = run.approved_sections?.[step]
                    const s = stepStatus(run.current_checkpoint, run.status, step)
                    return (
                      <details key={step} className={`rounded-2xl border transition-all ${s === 'done' ? 'border-emerald-100 bg-emerald-50/20' : 'border-purple/5 bg-purple/5 opacity-50 pointer-events-none'}`}>
                        <summary className="p-4 cursor-pointer flex items-center justify-between">
                          <span className={`text-[12px] font-black uppercase tracking-widest ${s === 'done' ? 'text-emerald-700' : 'text-text-muted'}`}>{STEP_LABELS[step]}</span>
                          {s === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        </summary>
                        {content && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-[12px] text-text-muted leading-relaxed line-clamp-3 italic">"{content}"</p>
                          </div>
                        )}
                      </details>
                    )
                  })}
                </div>
              </section>

              {/* Quick Instructions */}
              <section className="glass-card rounded-[40px] p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-2xl">
                <h3 className="text-lg font-black mb-4">ATS Engine Logic</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">1</div>
                    <p className="text-[12px] font-medium opacity-80">Verify name and contact payload first.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">2</div>
                    <p className="text-[12px] font-medium opacity-80">Refine experience blocks for impact-density.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">3</div>
                    <p className="text-[12px] font-medium opacity-80">Ensure technical matrix matches the target JD.</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
