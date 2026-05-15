import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { authAPI } from '../../api/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', full_name: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authAPI.register(form)
      toast.success('Registration successful! Check your email (or terminal).')
      navigate('/login')
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const first = Object.values(d).flat()[0]
        toast.error(first || 'Registration failed')
      } else toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#f5f4ff' }}>
      
      {/* Left panel — Hero */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #3b82f6 100%)' }}>
        
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

        <Link to="/" className="flex items-center gap-2.5 relative z-10 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Zap size={18} className="text-white fill-current" />
          </div>
          <span className="text-[15px] font-bold text-white">RoleIQ</span>
        </Link>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>
            <Sparkles size={11} /> Next-Gen Search
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-5 tracking-tight">
            Stop searching.<br />Start <span style={{ color: '#e0d7ff' }}>succeeding.</span>
          </h2>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Join 10,000+ professionals using AI to automate their job search and land more interviews.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
           {[
             'AI-Powered Resume Scoring',
             'Automatic CV Tailoring',
             'Application Tracking (Kanban)',
           ].map(text => (
             <div key={text} className="flex items-center gap-3 text-[13px] font-bold text-white">
               <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                 <ShieldCheck size={12} />
               </div>
               {text}
             </div>
           ))}
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
              <Zap size={17} className="text-white fill-current" />
            </div>
            <span className="text-[15px] font-bold text-text-heading">RoleIQ</span>
          </Link>

          <h1 className="text-2xl font-black text-text-heading mb-1 tracking-tight">Create your account</h1>
          <p className="text-[14px] text-text-muted mb-8">Get started with your AI-powered workspace today.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input type="text" name="full_name" value={form.full_name} onChange={handle} required
                  placeholder="John Doe" className="form-input pl-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input type="email" name="email" value={form.email} onChange={handle} required
                  placeholder="john@example.com" className="form-input pl-10" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="password" name="password" value={form.password} onChange={handle} required
                    placeholder="••••••••" className="form-input pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="password" name="password2" value={form.password2} onChange={handle} required
                    placeholder="••••••••" className="form-input pl-10" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating account...</> 
                       : <><Sparkles size={16} /> Create Free Account</>}
            </button>
          </form>

          <p className="mt-8 text-[13px] text-center text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-purple hover:underline">
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
