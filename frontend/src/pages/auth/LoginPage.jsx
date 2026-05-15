import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { authAPI } from '../../api/auth'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [notActivated, setNotActivated] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errorMsg) setErrorMsg('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotActivated(false)
    setErrorMsg('')

    try {
      const res = await authAPI.login(form)
      login({ access: res.data.access, refresh: res.data.refresh }, res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      const d = err.response?.data
      
      if (d?.resend_activation) {
        setNotActivated(true)
        setErrorMsg(d?.error || 'Account not activated.')
      } else {
        const msg = d?.error || d?.detail || 'Invalid email or password.'
        setErrorMsg(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    try {
      await authAPI.resendActivation(form.email)
      toast.success('Activation link sent to terminal!')
    } catch {
      toast.error('Resend failed')
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
          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Your career<br />command center
          </h2>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Resume intelligence, JD scoring, and AI-powered job matching — all in one place.
          </p>
        </div>

        <div className="relative z-10 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <p className="text-[13px] text-white font-medium italic mb-2">
            "Got 3 interviews in my first week of using RoleIQ."
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>— Early Adopter</p>
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

          <h1 className="text-2xl font-black text-text-heading mb-1 tracking-tight">Welcome back</h1>
          <p className="text-[14px] text-text-muted mb-8">Sign in to continue to your workspace</p>

          {/* Inline Error Message */}
          {errorMsg && (
            <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in
              ${notActivated ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle size={18} className={notActivated ? 'text-amber-600' : 'text-red-600'} />
              <div className="flex-1">
                <p className={`text-[13px] font-bold ${notActivated ? 'text-amber-800' : 'text-red-800'}`}>
                  {errorMsg}
                </p>
                {notActivated && (
                  <button onClick={resend} className="text-[12px] font-bold text-amber-600 underline mt-1 hover:text-amber-700">
                    Resend activation link →
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input type="email" name="email" value={form.email} onChange={handle} required
                  placeholder="name@company.com" className="form-input pl-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Password</label>
                <Link to="/forgot-password" className="text-[12px] font-bold text-brand-purple hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input type="password" name="password" value={form.password} onChange={handle} required
                  placeholder="••••••••" className="form-input pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in...</> 
                       : <><ArrowRight size={16} /> Sign In</>}
            </button>
          </form>

          <p className="mt-8 text-[13px] text-center text-text-muted">
            New to the platform?{' '}
            <Link to="/register" className="font-bold text-brand-purple hover:underline">
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}