import { useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KanbanSquare, Plus, X, ExternalLink, LoaderCircle, Calendar, Briefcase, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../api/applications'
import { jobDescriptionAPI } from '../api/jobDescriptions'
import AppLayout from '../components/layout/AppLayout'

const STATUS_COLUMNS = [
  {
    key: 'APPLIED',
    label: 'Applied',
    dot: '#7c3aed',
    accent: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.18)',
    headerBg: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.06))',
    tagBg: 'rgba(124,58,237,0.1)',
    tagColor: '#6d28d9',
  },
  {
    key: 'SCREENING',
    label: 'Screening',
    dot: '#f59e0b',
    accent: '#d97706',
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.2)',
    headerBg: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))',
    tagBg: 'rgba(245,158,11,0.1)',
    tagColor: '#b45309',
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    dot: '#3b82f6',
    accent: '#2563eb',
    bg: 'rgba(59,130,246,0.05)',
    border: 'rgba(59,130,246,0.2)',
    headerBg: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.05))',
    tagBg: 'rgba(59,130,246,0.1)',
    tagColor: '#1d4ed8',
  },
  {
    key: 'OFFER',
    label: 'Offer',
    dot: '#10b981',
    accent: '#059669',
    bg: 'rgba(16,185,129,0.05)',
    border: 'rgba(16,185,129,0.2)',
    headerBg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))',
    tagBg: 'rgba(16,185,129,0.1)',
    tagColor: '#047857',
  },
  {
    key: 'REJECTED',
    label: 'Rejected',
    dot: '#ef4444',
    accent: '#dc2626',
    bg: 'rgba(239,68,68,0.04)',
    border: 'rgba(239,68,68,0.18)',
    headerBg: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))',
    tagBg: 'rgba(239,68,68,0.08)',
    tagColor: '#b91c1c',
  },
  {
    key: 'WITHDRAWN',
    label: 'Withdrawn',
    dot: '#9ca3af',
    accent: '#6b7280',
    bg: 'rgba(156,163,175,0.06)',
    border: 'rgba(156,163,175,0.2)',
    headerBg: 'linear-gradient(135deg,rgba(156,163,175,0.14),rgba(156,163,175,0.06))',
    tagBg: 'rgba(156,163,175,0.1)',
    tagColor: '#4b5563',
  },
]

const SOURCE_OPTIONS = ['LinkedIn', 'Naukri', 'Company Website', 'Referral', 'Other']

/* ── Score badge ─────────────────────────── */
function ScoreBadge({ score }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'
  const bg = score >= 80 ? 'rgba(16,185,129,0.1)' : score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${color}30` }}>
      {score}%
    </span>
  )
}

/* ── Modal ─────────────────────────────── */
function AddApplicationModal({ isOpen, onClose, onSubmit, isSubmitting, jobDescriptions }) {
  const [form, setForm] = useState({
    company_name: '', role_title: '', source: 'LinkedIn',
    job_url: '', applied_date: new Date().toISOString().slice(0, 10),
    jd_id: '', jd_raw_text: '', notes: '',
  })

  if (!isOpen) return null

  const handleChange = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, jd_id: form.jd_id || null }, () => {
      setForm({ company_name: '', role_title: '', source: 'LinkedIn', job_url: '',
        applied_date: new Date().toISOString().slice(0, 10), jd_id: '', jd_raw_text: '', notes: '' })
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26,16,64,0.6)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-3xl rounded-3xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto"
        style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.18)',
          boxShadow: '0 32px 80px rgba(124,58,237,0.18)' }}>
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="badge-purple mb-2">Pipeline</div>
            <h2 className="text-2xl font-bold text-text-heading">Add Application</h2>
            <p className="text-[12px] text-text-muted mt-1">Track and manage your application journey</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Company Name</label>
              <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required className="form-input" placeholder="Google, Amazon..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Role Title</label>
              <input type="text" name="role_title" value={form.role_title} onChange={handleChange} required className="form-input" placeholder="Senior Software Engineer" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Source</label>
              <select name="source" value={form.source} onChange={handleChange} className="form-input">
                {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Applied Date</label>
              <input type="date" name="applied_date" value={form.applied_date} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Saved JD</label>
              <select name="jd_id" value={form.jd_id} onChange={handleChange} className="form-input">
                <option value="">None</option>
                {jobDescriptions.map((jd) => (
                  <option key={jd.id} value={jd.id}>{jd.company_name} — {jd.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Job URL</label>
            <input type="url" name="job_url" value={form.job_url} onChange={handleChange} className="form-input" placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">JD Text (optional)</label>
            <textarea name="jd_raw_text" value={form.jd_raw_text} onChange={handleChange}
              rows={4} className="form-input resize-none" placeholder="Paste the job description..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <><LoaderCircle size={14} className="animate-spin" /> Saving...</> : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Kanban Card ─────────────────────────── */
function KanbanCard({ app, col, drag, dragSnap }) {
  const date = app.applied_date
    ? new Date(app.applied_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  return (
    <Link
      to={`/applications/${app.id}`}
      ref={drag.innerRef}
      {...drag.draggableProps}
      {...drag.dragHandleProps}
      className="block rounded-2xl transition-all duration-200 group"
      style={{
        background: dragSnap.isDragging
          ? 'rgba(255,255,255,0.98)'
          : 'rgba(255,255,255,0.88)',
        border: dragSnap.isDragging
          ? `2px solid ${col.accent}`
          : `1.5px solid ${col.border}`,
        boxShadow: dragSnap.isDragging
          ? `0 16px 40px ${col.accent}30, 0 4px 12px rgba(0,0,0,0.08)`
          : '0 2px 8px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(8px)',
        padding: '14px 16px',
        cursor: 'grab',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 truncate"
            style={{ color: col.accent }}>
            {app.company_name}
          </p>
          <h3 className="text-[13px] font-bold text-text-heading truncate group-hover:text-brand-purple transition-colors leading-tight">
            {app.role_title}
          </h3>
        </div>
        <ExternalLink size={12}
          className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted flex-shrink-0 mt-0.5" />
      </div>

      {/* Divider */}
      <div className="my-2.5" style={{ height: '1px', background: `${col.border}` }} />

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md truncate"
            style={{ background: col.tagBg, color: col.tagColor }}>
            {app.source}
          </span>
          {date && (
            <span className="text-[10px] text-text-muted flex items-center gap-1 flex-shrink-0">
              <Calendar size={9} /> {date}
            </span>
          )}
        </div>
        {app.latest_score?.score != null && (
          <ScoreBadge score={app.latest_score.score} />
        )}
      </div>
    </Link>
  )
}

/* ── Column ──────────────────────────────── */
function KanbanColumn({ col, apps }) {
  return (
    <Droppable droppableId={col.key} key={col.key}>
      {(provided, snapshot) => (
        <section
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            width: '272px',
            background: snapshot.isDraggingOver
              ? col.bg.replace('0.06', '0.12').replace('0.05', '0.1').replace('0.04', '0.09')
              : col.bg,
            border: snapshot.isDraggingOver
              ? `2px dashed ${col.accent}60`
              : `1.5px solid ${col.border}`,
            boxShadow: snapshot.isDraggingOver
              ? `0 0 0 3px ${col.accent}15, inset 0 0 20px ${col.accent}08`
              : `0 2px 12px ${col.accent}08`,
            minHeight: '420px',
          }}
        >
          {/* Column header */}
          <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
            style={{ background: col.headerBg, borderBottom: `1px solid ${col.border}` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: col.accent, boxShadow: `0 0 6px ${col.accent}60` }} />
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider"
                style={{ color: col.accent }}>
                {col.label}
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${col.accent}18`, color: col.accent }}>
              {apps?.length || 0}
            </span>
          </div>

          {/* Cards area */}
          <div className="flex-1 p-3 space-y-2.5" style={{ minHeight: '200px' }}>
            {apps?.map((app, index) => (
              <Draggable draggableId={String(app.id)} index={index} key={app.id}>
                {(drag, dragSnap) => (
                  <KanbanCard app={app} col={col} drag={drag} dragSnap={dragSnap} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {(!apps || apps.length === 0) && (
              <div className="h-20 flex items-center justify-center rounded-xl mt-1"
                style={{ border: `1.5px dashed ${col.border}`, background: `${col.accent}04` }}>
                <p className="text-[11px] font-medium" style={{ color: `${col.accent}80` }}>
                  Drop cards here
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </Droppable>
  )
}

/* ── Stats bar ───────────────────────────── */
function StatsBar({ grouped }) {
  const total = STATUS_COLUMNS.reduce((s, col) => s + (grouped[col.key]?.length || 0), 0)
  const active = (grouped['APPLIED']?.length || 0) + (grouped['SCREENING']?.length || 0) + (grouped['INTERVIEW']?.length || 0)
  const offers = grouped['OFFER']?.length || 0
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {[
        { label: 'Total', value: total, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
        { label: 'Active', value: active, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
        { label: 'Offers', value: offers, color: '#059669', bg: 'rgba(16,185,129,0.08)' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
          style={{ background: bg, border: `1px solid ${color}25` }}>
          <span className="text-xl font-extrabold" style={{ color }}>{value}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main Page ──────────────────────────── */
export default function ApplicationsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.list().then((r) => r.data),
  })

  const { data: jobDescriptions = [] } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => jobDescriptionAPI.list().then((r) => r.data),
  })

  const grouped = useMemo(() =>
    STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = Array.isArray(applications)
        ? applications.filter((a) => a.status === col.key) : []
      return acc
    }, {}),
  [applications])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['applications'] })

  const createMutation = useMutation({
    mutationFn: (payload) => applicationsAPI.create(payload),
    onSuccess: async () => { toast.success('Application created.'); await refresh() },
    onError: (error) => {
      const data = error.response?.data
      if (data && typeof data === 'object') toast.error(String(Object.values(data).flat()[0]))
      else toast.error('Could not create application')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationsAPI.updateStatus(id, status),
    onSuccess: refresh,
    onError: () => { toast.error('Could not move application'); refresh() },
  })

  const handleCreate = (form, onDone) =>
    createMutation.mutate(form, { onSuccess: () => onDone() })

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const src = result.source.droppableId, dest = result.destination.droppableId
    if (src === dest) return
    statusMutation.mutate({ id: result.draggableId, status: dest })
  }

  const hasApps = Array.isArray(applications) && applications.length > 0

  return (
    <AppLayout>
      {/* Header */}
      <section className="page-header mb-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="badge-purple mb-3 inline-flex items-center gap-1.5">
              <KanbanSquare size={11} /> Tracking
            </div>
            <h1 className="text-3xl font-bold text-white">Kanban Board</h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Drag applications through stages. Stay organised and focused.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Plus size={16} /> Add Application
          </button>
        </div>
      </section>

      {/* Stats bar */}
      {hasApps && <StatsBar grouped={grouped} />}

      {/* Board */}
      <section>
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {STATUS_COLUMNS.map((col) => (
              <div key={col.key} className="flex-shrink-0 w-[272px] h-96 rounded-2xl skeleton" />
            ))}
          </div>
        ) : !hasApps ? (
          <div className="rounded-3xl p-16 text-center"
            style={{ border: '2px dashed rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(59,130,246,0.08))',
                border: '1px solid rgba(124,58,237,0.2)' }}>
              <KanbanSquare size={26} style={{ color: '#7c3aed' }} />
            </div>
            <h2 className="text-2xl font-bold text-text-heading mb-3">Start your pipeline</h2>
            <p className="text-text-muted text-sm mb-7 max-w-md mx-auto">
              Add your first application and start tracking your career journey.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={15} /> Create first card
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6"
              style={{ WebkitOverflowScrolling: 'touch' }}>
              {STATUS_COLUMNS.map((col) => (
                <KanbanColumn key={col.key} col={col} apps={grouped[col.key]} />
              ))}
            </div>
          </DragDropContext>
        )}
      </section>

      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        jobDescriptions={jobDescriptions}
      />
    </AppLayout>
  )
}
