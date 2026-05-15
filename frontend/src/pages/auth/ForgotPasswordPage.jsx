import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { authAPI } from '../../api/auth'

const pageStyle = { background: '#f5f4ff' }
const cardStyle = {
  background: '#fff',
  border: '1px solid rgba(124,58,237,0.18)',
  boxShadow: '0 8px 40px rgba(124,58,237,0.1)',
}
const btnStyle = {
  background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #3b82f6)',
  boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(email)
      setDone(true)
      toast.success(res.data.message || 'Reset link sent!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send reset link')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-sans" style={pageStyle}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <Zap size={22} className="text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-text-heading">Forgot Password?</h1>
          <p className="text-[13px] text-text-muted mt-1 text-center">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        <div className="rounded-3xl p-8" style={cardStyle}>
          {done ? (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle2 size={26} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-text-heading mb-2">Check your terminal</h2>
              <p className="text-[13px] text-text-muted leading-relaxed mb-7">
                If that email is registered, the reset link was printed in your Django terminal.
              </p>
              <div className="space-y-3">
                <button onClick={() => { setDone(false); setEmail('') }}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all btn-secondary justify-center">
                  Send another link
                </button>
                <Link to="/login" className="btn-primary w-full justify-center py-3" style={btnStyle}>
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="name@company.com" className="form-input pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 group transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={btnStyle}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </span>
                ) : <>Send Reset Link <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}

          {!done && (
            <p className="mt-6 text-center text-[13px] text-text-muted">
              Remembered it?{' '}
              <Link to="/login" className="font-bold text-brand-purple hover:underline">Sign in →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
