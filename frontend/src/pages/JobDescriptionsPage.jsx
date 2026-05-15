import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Building2, Plus, Search, X, ExternalLink, Archive, ScrollText, LoaderCircle, Sparkles, Filter, Calendar, Globe, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { jobDescriptionAPI } from '../api/jobDescriptions'
import AppLayout from '../components/layout/AppLayout'

function AnalysisBadge({ status }) {
  const map = {
    PENDING:    { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)', color: '#d97706', label: 'Queued' },
    PROCESSING: { bg: '#eff6ff', border: 'rgba(59,130,246,0.3)',  color: '#2563eb', label: 'Analyzing' },
    DONE:       { bg: '#f0fdf4', border: 'rgba(16,185,129,0.3)',  color: '#059669', label: 'Ready' },
    FAILED:     { bg: '#fff1f1', border: 'rgba(239,68,68,0.3)',   color: '#dc2626', label: 'Error' },
  }
  const t = map[status] || map.PENDING
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>
      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'PROCESSING' ? 'animate-pulse' : ''}`} style={{ background: t.color }} />
      {t.label}
    </span>
  )
}

function JobDescriptionModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ title: '', company_name: '', raw_text: '', source_url: '' })
  if (!isOpen) return null

  const handleChange = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form, () => { setForm({ title: '', company_name: '', raw_text: '', source_url: '' }); onClose() })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26,16,64,0.6)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-2xl rounded-[32px] p-10 animate-scale-in max-h-[90vh] overflow-y-auto"
        style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.18)',
          boxShadow: '0 32px 80px rgba(124,58,237,0.2)' }}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <ScrollText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-heading tracking-tight">Add Specification</h2>
              <p className="text-[12px] text-text-muted font-medium">Store role details for AI intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-muted">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Job Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Senior Product Designer" className="form-input" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Company</label>
              <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required
                placeholder="TechCorp Inc." className="form-input" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Source URL (optional)</label>
            <input type="url" name="source_url" value={form.source_url} onChange={handleChange}
              placeholder="https://linkedin.com/jobs/..." className="form-input" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Job Description Text</label>
            <textarea name="raw_text" value={form.raw_text} onChange={handleChange} required rows={8}
              placeholder="Paste the full job description here..." className="form-input resize-none p-4" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-purple/5">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[160px]">
              {isSubmitting ? <><LoaderCircle size={16} className="animate-spin" /> Saving...</> : 'Save Specification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JobDescriptionsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: jobDescriptions = [], isLoading } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => jobDescriptionAPI.list().then((r) => r.data?.results ?? r.data),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return Array.isArray(jobDescriptions) ? jobDescriptions : []
    return Array.isArray(jobDescriptions)
      ? jobDescriptions.filter((jd) =>
          [jd.title, jd.company_name, jd.raw_text].join(' ').toLowerCase().includes(q))
      : []
  }, [jobDescriptions, search])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['job-descriptions'] })

  const createMutation = useMutation({
    mutationFn: (payload) => jobDescriptionAPI.create(payload),
    onSuccess: async () => { toast.success('Job description saved.'); await refresh() },
    onError: (error) => {
      const data = error?.response?.data
      if (typeof data === 'string') { toast.error(data); return }
      if (data && typeof data === 'object') {
        const first = Object.values(data).flat?.()[0]
        if (first) { toast.error(String(first)); return }
      }
      toast.error('Could not save this job description')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => jobDescriptionAPI.update(id, { is_archived: true }),
    onSuccess: async () => { toast.success('Archived.'); await refresh() },
    onError: () => toast.error('Could not archive'),
  })

  const handleCreate = (form, onDone) =>
    createMutation.mutate(form, { onSuccess: () => onDone() })

  const empty = !Array.isArray(jobDescriptions) || jobDescriptions.length === 0

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <section className="page-header mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-4">
                <ScrollText size={12} /> Resource Catalog
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Job Library</h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Curating role intelligence for automated scoring and strategy.
              </p>
            </div>
            <button onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#fff', color: '#1a1040', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <Plus size={18} /> Add Specification
            </button>
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, or keywords…"
              className="w-full bg-white border border-brand-purple/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-text-heading outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/5 transition-all shadow-sm"
            />
          </div>
          <button className="px-6 py-4 rounded-2xl bg-white border border-brand-purple/10 text-text-muted hover:text-brand-purple hover:border-brand-purple transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Catalog Grid */}
        <section>
          {isLoading ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {[1,2,3,4].map((i) => <div key={i} className="h-72 rounded-[32px] skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[40px] p-24 text-center bg-white border border-brand-purple/5 shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-inner"
                style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
                <Briefcase size={32} className="text-brand-purple/40" />
              </div>
              <h2 className="text-2xl font-black text-text-heading mb-3">
                {empty ? 'Empty Catalog' : 'No matches found'}
              </h2>
              <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto font-medium">
                {empty
                  ? 'Populate your library with job specifications to unlock AI match scoring.'
                  : "We couldn't find any specifications matching your search criteria."}
              </p>
              {empty && (
                <button onClick={() => setIsModalOpen(true)} className="btn-primary px-10 py-4">
                  <Plus size={18} /> Initialize Library
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {filtered.map((jd) => (
                <article key={jd.id} className="group relative bg-white border border-brand-purple/10 rounded-[32px] p-8 transition-all duration-300 hover:border-brand-purple/30 hover:shadow-2xl hover:shadow-brand-purple/5 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-xl bg-brand-purple/5 flex items-center justify-center text-brand-purple">
                      <ChevronRight size={20} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-purple/10 mb-5 group-hover:scale-110 transition-transform">
                        <Briefcase size={28} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-purple mb-1">
                          {jd.company_name}
                        </p>
                        <h2 className="text-xl font-black text-text-heading group-hover:text-brand-purple transition-colors leading-tight">
                          {jd.title}
                        </h2>
                      </div>
                    </div>
                    <div className="pt-2">
                      <AnalysisBadge status={jd.analysis?.status || 'PENDING'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-purple/5 border border-purple/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                        <Calendar size={10} /> Captured
                      </p>
                      <p className="text-[13px] font-bold text-text-heading">
                        {new Date(jd.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                        <Globe size={10} /> Origin
                      </p>
                      <p className="text-[13px] font-bold text-text-heading truncate">
                        {jd.source_url ? 'Source Verified' : 'Direct Upload'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8 p-6 rounded-2xl bg-[#fafafa] border border-black/5 relative overflow-hidden">
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-text-muted font-medium italic">
                      {jd.raw_text}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none bg-gradient-to-t from-[#fafafa] to-transparent" />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-6 border-t border-purple/5">
                    <Link to={`/job-descriptions/${jd.id}`} className="btn-primary text-[12px] px-6">
                      Investigate <Sparkles size={14} />
                    </Link>
                    <button onClick={() => archiveMutation.mutate(jd.id)}
                      disabled={archiveMutation.isPending}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <Archive size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <JobDescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </AppLayout>
  )
}
