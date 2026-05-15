import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle, ArrowLeft, CheckCircle, Clock, RefreshCcw, Archive,
  Briefcase, Building2, Globe, FileText, ChevronRight, ChevronDown,
  Rocket, Sparkles, Upload, Play, Loader2, Check, X, Copy,
  Download, ChevronLeft, Brain, ScrollText, MessageSquare, Zap,
  FlipHorizontal, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { jobDescriptionAPI } from '../api/jobDescriptions'
import { resumeAPI } from '../api/resumes'
import { aiWorkflowAPI } from '../api/aiWorkflow'
import AppLayout from '../components/layout/AppLayout'
 
// ─── Design tokens (matches existing page) ───────────────────────────────────
const sectionStyle = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(124,58,237,0.12)',
  boxShadow: '0 8px 32px rgba(124,58,237,0.06)',
}
const labelCls = 'block text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2'
 
// ─── Pipeline step definitions ────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    key: 'jd_analysis',
    label: 'JD Analysis',
    sublabel: 'Agent 1 — Parsing role requirements',
    icon: FileText,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    key: 'resume_score',
    label: 'Resume Match',
    sublabel: 'Agent 2 — Scoring fit against JD',
    icon: Zap,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    key: 'cv_generation',
    label: 'CV Generation',
    sublabel: 'Agent 3 — Crafting a tailored CV',
    icon: ScrollText,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
  {
    key: 'resume_generation',
    label: 'Resume Generation',
    sublabel: 'Agent 4 — Building optimized resume',
    icon: Brain,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    key: 'interview_questions',
    label: 'Interview Prep',
    sublabel: 'Agent 5 — Generating question bank',
    icon: MessageSquare,
    color: '#db2777',
    bg: 'rgba(219,39,119,0.08)',
  },
]
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
function AnalysisBadge({ status }) {
  const map = {
    PENDING:    { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)',  color: '#d97706', label: 'Queued' },
    PROCESSING: { bg: '#eff6ff', border: 'rgba(59,130,246,0.3)',  color: '#2563eb', label: 'Analyzing' },
    DONE:       { bg: '#f0fdf4', border: 'rgba(16,185,129,0.3)',  color: '#059669', label: 'Ready' },
    FAILED:     { bg: '#fff1f1', border: 'rgba(239,68,68,0.3)',   color: '#dc2626', label: 'Error' },
  }
  const t = map[status] || map.PENDING
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-sm"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>
      <span className="w-1.5 h-1.5 rounded-full mr-2 animate-pulse" style={{ background: t.color }} />
      {t.label}
    </span>
  )
}
 
function StepStatusIcon({ status }) {
  if (status === 'DONE') return (
    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
      <Check size={14} className="text-white" strokeWidth={3} />
    </div>
  )
  if (status === 'PROCESSING') return (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
      <Loader2 size={14} className="text-white animate-spin" />
    </div>
  )
  if (status === 'PENDING') return (
    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200 shadow-sm flex-shrink-0 animate-pulse">
      <Clock size={12} className="text-blue-500" />
    </div>
  )
  if (status === 'FAILED') return (
    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
      <X size={14} className="text-white" strokeWidth={3} />
    </div>
  )
  // NOT_STARTED
  return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-gray-300" />
    </div>
  )
}
 
// ─── Interview Flashcard Component ────────────────────────────────────────────
function FlashcardDeck({ questions, category, color }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
 
  if (!questions || questions.length === 0) return null
 
  const handleCopy = () => {
    navigator.clipboard.writeText(questions[index])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
 
  return (
    <div className="space-y-3">
      {/* Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        className="relative cursor-pointer rounded-2xl p-5 transition-all duration-300 active:scale-[0.98] select-none"
        style={{
          background: flipped
            ? `linear-gradient(135deg, ${color}15, ${color}08)`
            : 'white',
          border: `1px solid ${color}25`,
          boxShadow: `0 4px 20px ${color}12`,
          minHeight: 100,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${color}15` }}>
            <span className="text-[10px] font-black" style={{ color }}>Q</span>
          </div>
          <p className="text-[13px] font-semibold text-text-heading leading-relaxed flex-1">
            {questions[index]}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: `${color}15` }}>
          <FlipHorizontal size={11} style={{ color: `${color}60` }} />
          <span className="text-[10px]" style={{ color: `${color}60` }}>
            {flipped ? 'Click to flip back' : 'Click card to flip'}
          </span>
        </div>
      </div>
 
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false) }}
            disabled={index === 0}
            className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: `${color}20` }}
          >
            <ChevronLeft size={14} className="text-text-muted" />
          </button>
          <span className="text-[11px] font-bold text-text-muted tabular-nums">
            {index + 1} / {questions.length}
          </span>
          <button
            onClick={() => { setIndex(i => Math.min(questions.length - 1, i + 1)); setFlipped(false) }}
            disabled={index === questions.length - 1}
            className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: `${color}20` }}
          >
            <ChevronRight size={14} className="text-text-muted" />
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
          style={{
            background: copied ? '#f0fdf4' : `${color}10`,
            color: copied ? '#059669' : color,
            border: `1px solid ${copied ? '#86efac' : `${color}20`}`,
          }}
        >
          {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
 
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIndex(i); setFlipped(false) }}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === index ? 20 : 6,
              height: 6,
              background: i === index ? color : `${color}30`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
 
// ─── Results Panel ────────────────────────────────────────────────────────────
function ResultsPanel({ steps }) {
  const [activeTab, setActiveTab] = useState('cv_generation')
 
  const cvDone = steps?.cv_generation?.status === 'DONE'
  const resumeDone = steps?.resume_generation?.status === 'DONE'
  const iqDone = steps?.interview_questions?.status === 'DONE'
 
  const tabs = [
    { key: 'cv_generation',       label: 'CV',        icon: ScrollText,     color: '#059669', available: cvDone },
    { key: 'resume_generation',   label: 'Resume',    icon: Brain,          color: '#d97706', available: resumeDone },
    { key: 'interview_questions', label: 'Interview', icon: MessageSquare,  color: '#db2777', available: iqDone },
  ]
 
  // Auto-switch to first available tab
  useEffect(() => {
    const first = tabs.find(t => t.available)
    if (first && !tabs.find(t => t.key === activeTab)?.available) {
      setActiveTab(first.key)
    }
  }, [cvDone, resumeDone, iqDone])
 
  const copyAll = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }
 
  const downloadText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }
 
  const activeTab_ = tabs.find(t => t.key === activeTab) || tabs[0]
 
  return (
    <div className="rounded-[32px] overflow-hidden" style={{
      border: '1px solid rgba(124,58,237,0.1)',
      boxShadow: '0 20px 60px rgba(124,58,237,0.08)',
      background: 'white',
    }}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-gray-50/80">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => tab.available && setActiveTab(tab.key)}
              disabled={!tab.available}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 text-[12px] font-bold transition-all relative"
              style={{
                color: isActive ? tab.color : tab.available ? '#6b7280' : '#d1d5db',
                background: isActive ? 'white' : 'transparent',
                cursor: tab.available ? 'pointer' : 'not-allowed',
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.available && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tab.color }} />
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: tab.color }} />
              )}
            </button>
          )
        })}
      </div>
 
      {/* Tab content */}
      <div className="p-8">
        {/* CV */}
        {activeTab === 'cv_generation' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-text-heading">Generated CV</h3>
                <p className="text-[12px] text-text-muted mt-0.5">Tailored to the role by Agent 3</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyAll(steps?.cv_generation?.data || '')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <Copy size={13} /> Copy
                </button>
                <button onClick={() => downloadText(steps?.cv_generation?.data || '', 'cv.txt')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 max-h-[500px] overflow-y-auto">
              <pre className="text-[12px] leading-relaxed text-text-body font-mono whitespace-pre-wrap">
                {steps?.cv_generation?.data || 'No content available.'}
              </pre>
            </div>
          </div>
        )}
 
        {/* Resume */}
        {activeTab === 'resume_generation' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-text-heading">Optimized Resume</h3>
                <p className="text-[12px] text-text-muted mt-0.5">Built for this role by Agent 4</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyAll(steps?.resume_generation?.data || '')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                  <Copy size={13} /> Copy
                </button>
                <button onClick={() => downloadText(steps?.resume_generation?.data || '', 'resume.txt')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 max-h-[500px] overflow-y-auto">
              <pre className="text-[12px] leading-relaxed text-text-body font-mono whitespace-pre-wrap">
                {steps?.resume_generation?.data || 'No content available.'}
              </pre>
            </div>
          </div>
        )}
 
        {/* Interview Questions */}
        {activeTab === 'interview_questions' && (() => {
          const iq = steps?.interview_questions?.data
          const allQuestions = [
            ...(iq?.technical || []),
            ...(iq?.behavioral || []),
            ...(iq?.role_specific || []),
          ]
 
          const downloadAll = () => {
            const lines = [
              '=== TECHNICAL QUESTIONS ===',
              ...(iq?.technical || []).map((q, i) => `${i + 1}. ${q}`),
              '',
              '=== BEHAVIORAL QUESTIONS ===',
              ...(iq?.behavioral || []).map((q, i) => `${i + 1}. ${q}`),
              '',
              '=== ROLE-SPECIFIC QUESTIONS ===',
              ...(iq?.role_specific || []).map((q, i) => `${i + 1}. ${q}`),
            ].join('\n')
            downloadText(lines, 'interview_questions.txt')
          }
 
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-text-heading">Interview Question Bank</h3>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    {allQuestions.length} questions generated by Agent 5 · Click cards to flip
                  </p>
                </div>
                <button onClick={downloadAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors">
                  <Download size={13} /> Download All
                </button>
              </div>
 
              {/* Three flashcard decks */}
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  { key: 'technical',    label: 'Technical',    color: '#7c3aed', qs: iq?.technical },
                  { key: 'behavioral',   label: 'Behavioral',   color: '#2563eb', qs: iq?.behavioral },
                  { key: 'role_specific', label: 'Role-Specific', color: '#db2777', qs: iq?.role_specific },
                ].map(({ key, label, color, qs }) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
                        {label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}12`, color }}>
                        {qs?.length || 0} cards
                      </span>
                    </div>
                    <FlashcardDeck questions={qs} category={label} color={color} />
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
 
// ─── Smart Optimization Flow (main new section) ───────────────────────────────
function SmartOptimizationFlow({ jdId, jdTitle, isAnalysisDone }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [isPolling, setIsPolling] = useState(false)
 
  // Load user's resume library
  const { data: resumeData } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list().then(r => r.data),
  })
  const resumes = resumeData?.results ?? resumeData ?? []
 
  // Upload new resume inline
  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('version_name', `Uploaded for ${jdTitle}`)
      return resumeAPI.upload(fd)
    },
    onSuccess: async (res) => {
      toast.success('Resume uploaded!')
      await queryClient.invalidateQueries({ queryKey: ['resumes'] })
      setSelectedResumeId(String(res.data.id))
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  })
 
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) { toast.error('Only PDF files accepted.'); return }
    uploadMutation.mutate(file)
    e.target.value = ''
  }
 
  // Pipeline trigger
  const runMutation = useMutation({
    mutationFn: () => aiWorkflowAPI.runPipeline(jdId, selectedResumeId),
    onSuccess: () => {
      toast.success('Pipeline started! Agents are running...')
      setIsPolling(true)
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', jdId] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not start pipeline.'),
  })
 
  // Status polling
  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline-status', jdId],
    queryFn: () => aiWorkflowAPI.getStatus(jdId).then(r => r.data),
    enabled: isPolling,
    refetchInterval: (query) => {
      if (!isPolling) return false
      const steps = query.state.data?.steps
      if (!steps) return 3000
      const terminal = ['DONE', 'FAILED', 'NOT_STARTED']
      const allDone = Object.values(steps).every(s => terminal.includes(s.status))
      return allDone ? false : 3000
    },
    onSuccess: (data) => {
      const steps = data?.steps
      if (!steps) return

      // Log errors to console for deep debugging
      Object.entries(steps).forEach(([step, data]) => {
        if (data.status === 'FAILED' && data.error_message) {
          console.error(`AI Pipeline Step Failed [${step}]:`, data.error_message);
        }
      });

      const terminal = ['DONE', 'FAILED', 'NOT_STARTED']
      const allDone = Object.values(steps).every(s => terminal.includes(s.status))
      if (allDone) {
        setIsPolling(false)
        const anyFailed = Object.values(steps).some(s => s.status === 'FAILED')
        if (anyFailed) toast.error('Some steps failed. Check the status below.')
        else toast.success('All agents completed! Review your results below.')
      }
    },
  })
 
  const steps = pipelineData?.steps
  const hasRunBefore = steps && Object.values(steps).some(s => s.status !== 'NOT_STARTED')
  const hasResults = steps && (
    steps.cv_generation?.status === 'DONE' ||
    steps.resume_generation?.status === 'DONE' ||
    steps.interview_questions?.status === 'DONE'
  )
 
  const overallProgress = steps
    ? PIPELINE_STEPS.filter(s => steps[s.key]?.status === 'DONE').length
    : 0
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[32px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1e3a8a 100%)',
          boxShadow: '0 20px 60px rgba(26,16,64,0.35)',
        }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-purple/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
 
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-4">
                <Sparkles size={12} className="text-purple-300" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-purple-300">
                  Smart Optimization Flow
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                5-Agent AI Pipeline
              </h2>
              <p className="text-white/50 text-[13px] mt-2 max-w-md">
                Run all five AI agents in sequence — from parsing the JD to generating
                a tailored CV, resume, and interview question bank.
              </p>
            </div>
 
            {hasRunBefore && (
              <div className="flex-shrink-0 text-center">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300">
                  {overallProgress}<span className="text-2xl text-white/40">/5</span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mt-1">
                  Steps Complete
                </p>
              </div>
            )}
          </div>
 
          {/* Resume selector + launch */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              {/* Dropdown */}
              <div className="flex-1 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/50">
                  Select Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={e => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-[13px] font-semibold text-text-heading bg-white border-0 shadow-lg focus:ring-2 focus:ring-brand-purple/30 outline-none appearance-none"
                >
                  <option value="">— Choose from your library —</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.version_name || r.original_filename}
                      {r.is_active ? ' ✓ Active' : ''}
                    </option>
                  ))}
                </select>
              </div>
 
              {/* Upload new */}
              <div className="flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] transition-all border border-white/20 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {uploadMutation.isPending
                    ? <><Loader2 size={15} className="animate-spin" /> Uploading...</>
                    : <><Upload size={15} /> Upload PDF</>
                  }
                </button>
              </div>
 
              {/* Run button */}
              <button
                type="button"
                disabled={!selectedResumeId || runMutation.isPending || !isAnalysisDone}
                onClick={() => runMutation.mutate()}
                className="flex-shrink-0 flex items-center gap-2.5 px-8 py-3 rounded-2xl font-black text-[14px] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: selectedResumeId && isAnalysisDone
                    ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  boxShadow: selectedResumeId && isAnalysisDone
                    ? '0 8px 24px rgba(124,58,237,0.4)'
                    : 'none',
                }}
              >
                {runMutation.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Starting...</>
                  : hasRunBefore
                    ? <><RotateCcw size={16} /> Re-run Pipeline</>
                    : <><Play size={16} /> Launch Pipeline</>
                }
              </button>
            </div>
 
            {!isAnalysisDone && (
              <p className="mt-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                <Clock size={11} />
                Waiting for JD Analysis to complete before pipeline can run.
              </p>
            )}
          </div>
        </div>
      </div>
 
      {/* Stepper — only show once triggered */}
      {hasRunBefore && steps && (
        <div className="rounded-[32px] p-8" style={sectionStyle}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
            Pipeline Progress
          </h3>
          <div className="space-y-0">
            {PIPELINE_STEPS.map((step, idx) => {
              const stepData = steps[step.key] || { status: 'NOT_STARTED' }
              const Icon = step.icon
              const isLast = idx === PIPELINE_STEPS.length - 1
              const isDone = stepData.status === 'DONE'
              const isFailed = stepData.status === 'FAILED'
              const isActive = stepData.status === 'PROCESSING'
 
              return (
                <div key={step.key} className="flex gap-4">
                  {/* Left: icon + connector line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500"
                      style={{
                        background: isDone ? step.color : isActive ? `${step.color}20` : 'white',
                        border: `2px solid ${isDone ? step.color : isActive ? step.color : '#e5e7eb'}`,
                        boxShadow: isActive ? `0 0 0 4px ${step.color}20` : 'none',
                      }}>
                      <Icon size={16} style={{ color: isDone ? 'white' : isActive ? step.color : '#9ca3af' }} />
                    </div>
                    {!isLast && (
                      <div className="w-0.5 h-8 mt-1 rounded-full transition-all duration-700"
                        style={{ background: isDone ? step.color : '#e5e7eb' }} />
                    )}
                  </div>
 
                  {/* Right: label + status */}
                  <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-start justify-between gap-4 pt-1.5">
                      <div>
                        <p className="text-[13px] font-bold text-text-heading">{step.label}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{step.sublabel}</p>
                        {isFailed && stepData.error_message && (
                          <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} />
                            {stepData.error_message}
                          </p>
                        )}
                      </div>
                      <StepStatusIcon status={stepData.status} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {/* Results */}
      {hasResults && <ResultsPanel steps={steps} />}
    </div>
  )
}
 
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobDescriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const [showResp, setShowResp] = useState(true)
 
  const { data: jd, isLoading } = useQuery({
    queryKey: ['job-description', id],
    queryFn: () => jobDescriptionAPI.get(id).then((r) => r.data),
    refetchInterval: (query) => {
      const s = query.state.data?.analysis?.status
      return s === 'PENDING' || s === 'PROCESSING' ? 2000 : false
    },
  })
 
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['job-description', id] }),
    queryClient.invalidateQueries({ queryKey: ['job-descriptions'] }),
  ])
 
  const updateMutation = useMutation({
    mutationFn: (p) => jobDescriptionAPI.update(id, p),
    onSuccess: async () => { toast.success('Updated.'); setForm(null); await refresh() },
    onError: () => toast.error('Could not update'),
  })
 
  const reanalyzeMutation = useMutation({
    mutationFn: () => jobDescriptionAPI.reanalyze(id),
    onSuccess: async () => { toast.success('Analysis queued.'); await refresh() },
    onError: () => toast.error('Could not requeue analysis'),
  })
 
  const archiveMutation = useMutation({
    mutationFn: () => jobDescriptionAPI.update(id, { is_archived: true }),
    onSuccess: async () => {
      toast.success('Archived.')
      await queryClient.invalidateQueries({ queryKey: ['job-descriptions'] })
      navigate('/job-descriptions')
    },
    onError: () => toast.error('Could not archive'),
  })
 
  const activateResumeMutation = useMutation({
    mutationFn: (rId) => resumeAPI.activate(rId),
    onSuccess: async () => {
      toast.success('Resume set as active.')
      await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: ['resumes'] })])
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not set resume active'),
  })
 
  const currentForm = form || {
    title: jd?.title || '',
    company_name: jd?.company_name || '',
    raw_text: jd?.raw_text || '',
    source_url: jd?.source_url || '',
  }
  const handleChange = (e) => setForm((c) => ({ ...(c || currentForm), [e.target.name]: e.target.value }))
  const handleSave = (e) => { e.preventDefault(); updateMutation.mutate(currentForm) }
 
  const analysis = jd?.analysis
  const resumeMatch = jd?.resume_match
  const analysisStatus = analysis?.status || 'PENDING'
  const isAnalysisDone = analysisStatus === 'DONE'
  const isAnalysisBusy = analysisStatus === 'PENDING' || analysisStatus === 'PROCESSING'
 
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <Link to="/job-descriptions"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-purple mb-8 group transition-all">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-brand-purple/10 group-hover:bg-brand-purple group-hover:text-white transition-all shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Back to Library
        </Link>
 
        {isLoading ? (
          <div className="h-[800px] rounded-[32px] skeleton" />
        ) : (
          <div className="space-y-12">
            {/* ── Smart Optimization Flow (Primary Page Content) ─────────── */}
            <div>
              <SmartOptimizationFlow
                jdId={id}
                jdTitle={jd?.title || ''}
                isAnalysisDone={isAnalysisDone}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
