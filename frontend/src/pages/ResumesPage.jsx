import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink, LoaderCircle, Plus, ShieldCheck, Trash2,
  Upload, FileText, AlertCircle, X, CheckCircle2, Search, Sparkles, Filter, Calendar, Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { resumeAPI } from '../api/resumes'
import { Link } from 'react-router-dom'

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(124,58,237,0.12)',
  boxShadow: '0 8px 32px rgba(124,58,237,0.06)'
}

/* ── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const tones = {
    PENDING: { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)', color: '#d97706', label: 'Queued' },
    PROCESSING: { bg: '#eff6ff', border: 'rgba(59,130,246,0.3)', color: '#2563eb', label: 'Parsing' },
    ANALYZING: { bg: '#f0ebff', border: 'rgba(124,58,237,0.3)', color: '#7c3aed', label: 'Analyzing' },
    DONE: { bg: '#f0fdf4', border: 'rgba(16,185,129,0.3)', color: '#059669', label: 'Ready' },
    FAILED: { bg: '#fff1f1', border: 'rgba(239,68,68,0.3)', color: '#dc2626', label: 'Error' },
  }
  const t = tones[status] || tones.PENDING
  const busy = status === 'PROCESSING' || status === 'ANALYZING'

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>
      <div className={`w-1.5 h-1.5 rounded-full ${busy ? 'animate-pulse' : ''}`} style={{ background: t.color }} />
      {t.label}
    </span>
  )
}

/* ── Upload Modal ────────────────────────────────────────── */
function ResumeUploadModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [versionName, setVersionName] = useState('Professional Master')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  if (!isOpen) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()
    onSubmit({ versionName, file }, () => {
      setVersionName('Professional Master')
      setFile(null)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26,16,64,0.6)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg rounded-[32px] p-10 animate-scale-in overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 40px 100px rgba(26,16,64,0.2)' }}>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-heading tracking-tight">Upload Asset</h2>
              <p className="text-[12px] mt-1 text-text-muted font-medium">New resume version for AI audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted ml-1">Version Label</label>
            <input type="text" value={versionName} onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g. Senior Frontend Dev v2" className="form-input" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted ml-1">Document Payload</label>
            <label className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-[24px] p-12 text-center transition-all duration-300
              ${dragging ? 'bg-purple-50 border-purple' : 'bg-[#fafafa] border-purple/10 hover:border-purple/30'}`}
              style={{ borderStyle: 'dashed', borderWidth: '2px' }}
              onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDrop={() => setDragging(false)}>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-purple/10 shadow-sm transition-transform group-hover:scale-110 group-hover:shadow-purple/20">
                <FileText size={28} className="text-purple" />
              </div>
              <span className="text-sm font-bold text-text-heading mb-1">{file ? file.name : 'Drag & Drop Resume'}</span>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">PDF Only · Max 5MB</span>
              <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple/5">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || !file} className="btn-primary min-w-[160px]">
              {isSubmitting ? <><LoaderCircle size={16} className="animate-spin" /> Processing...</> : <><Upload size={16} /> Deploy Version</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────── */
export default function ResumesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list().then((r) => r.data?.results ?? r.data),
    staleTime: 5000,
    refetchInterval: (query) => {
      const records = query.state.data
      return Array.isArray(records) && records.some((r) => r.parse_status === 'PROCESSING' || r.parse_status === 'PENDING' || r.analysis?.status === 'PROCESSING') ? 3000 : false
    },
  })

  const refreshResumes = () => queryClient.invalidateQueries({ queryKey: ['resumes'] })

  const uploadMutation = useMutation({
    mutationFn: ({ versionName, file }) => {
      const fd = new FormData()
      fd.append('version_name', versionName || 'Default')
      fd.append('resume', file)
      return resumeAPI.upload(fd)
    },
    onSuccess: async (res) => {
      if (res?.data?.duplicate) toast('Identical document found. Reusing analysis.', { icon: 'ℹ️' })
      else toast.success('Resume deployed and analysis initiated.')
      await refreshResumes()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Deployment failed'),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => resumeAPI.activate(id),
    onSuccess: async () => { toast.success('Master resume updated.'); await refreshResumes() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => resumeAPI.delete(id),
    onSuccess: async () => { toast.success('Document purged.'); await refreshResumes() },
    onError: (e) => toast.error(e.response?.data?.error || 'Purge failed'),
  })

  const filtered = Array.isArray(resumes) ? resumes.filter(r => r.version_name.toLowerCase().includes(search.toLowerCase())) : []
  const total = filtered.length
  const processing = filtered.filter(r => r.parse_status !== 'DONE' || r.analysis?.status === 'PROCESSING').length

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <section className="page-header mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-4">
                <Award size={12} /> Asset Management
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Resume Library</h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Deploying multiple versions for granular AI match optimization.
              </p>
            </div>
            <button onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#fff', color: '#1a1040', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <Plus size={18} /> New Version
            </button>
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" />
            <input type="text" placeholder="Search versions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-brand-purple/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-text-heading outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/5 transition-all shadow-sm" />
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl px-6 py-2 bg-white border border-purple/10 shadow-sm flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-black text-brand-purple leading-tight">{total}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Stored</p>
              </div>
              <div className="w-px h-8 bg-purple/10" />
              <div className="text-center">
                <p className="text-xl font-black text-blue-500 leading-tight">{processing}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Active AI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Versions Grid */}
        <section>
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-[32px] skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[40px] p-24 text-center bg-white border border-brand-purple/5 shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-inner"
                style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
                <FileText size={32} className="text-brand-purple/40" />
              </div>
              <h2 className="text-2xl font-black text-text-heading mb-3">No Versions Found</h2>
              <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto font-medium">
                Upload your master resume to begin the automated analysis and scoring workflow.
              </p>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary px-10 py-4">
                <Plus size={18} /> Initialize Assets
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <article key={r.id} className="group relative bg-white border border-brand-purple/10 rounded-[32px] p-8 transition-all duration-300 hover:border-brand-purple/30 hover:shadow-2xl hover:shadow-brand-purple/5 hover:-translate-y-1">
                  {r.is_active && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-purple/30">
                        <ShieldCheck size={10} /> Master
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteMutation.mutate(r.id)}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center mb-8 pt-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-purple/10 mb-5 group-hover:scale-110 transition-transform">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-black text-text-heading leading-tight mb-2 px-4">
                      {r.version_name}
                    </h3>
                    <p className="text-[11px] text-text-muted font-medium flex items-center gap-1.5">
                      <Calendar size={10} /> {new Date(r.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center">
                      <StatusBadge status={r.parse_status === 'DONE' ? (r.analysis?.status || 'PENDING') : r.parse_status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Link to={`/resumes/${r.id}`} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-purple/5 text-brand-purple text-[12px] font-bold hover:bg-brand-purple hover:text-white transition-all">
                        Analysis <Sparkles size={14} />
                      </Link>
                      {!r.is_active && r.parse_status === 'DONE' ? (
                        <button onClick={() => activateMutation.mutate(r.id)} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#fafafa] border border-black/5 text-text-muted text-[12px] font-bold hover:bg-white hover:text-brand-purple hover:border-brand-purple transition-all">
                          Activate
                        </button>
                      ) : (
                        <div className="flex items-center justify-center py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest">
                          Deployed
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <ResumeUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onSubmit={(data, cb) => uploadMutation.mutate(data, { onSuccess: cb })} isSubmitting={uploadMutation.isPending} />
    </AppLayout>
  )
}
