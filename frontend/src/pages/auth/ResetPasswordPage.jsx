import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Lock, CheckCircle2, Zap, ArrowRight } from 'lucide-react'
import { authAPI } from '../../api/auth'

const btnStyle = {
  background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #3b82f6)',
  boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!token) { toast.error('Missing reset token in the URL'); return }
    if (form.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.new_password !== form.confirm_password) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await authAPI.resetPassword({ token, new_password: form.new_password })
      setDone(true)
      toast.success(res.data.message || 'Password reset complete')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-sans" style={{ background: '#f5f4ff' }}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <Zap size={22} className="text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-text-heading">Reset Password</h1>
          <p className="text-[13px] text-text-muted mt-1">Choose a new password for your account.</p>
        </div>

        <div className="rounded-3xl p-8"
          style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>

          {!token && (
            <div className="rounded-xl p-4 mb-6"
              style={{ background: '#fff1f1', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-[13px] text-red-700 font-medium">
                This reset link is missing its token. Open the full link from your terminal again.
              </p>
            </div>
          )}

          {done ? (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle2 size={26} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-text-heading mb-2">Password Updated!</h2>
              <p className="text-[13px] text-text-muted mb-7">
                Your password has been reset. You can now sign in with the new password.
              </p>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-[14px] transition-all hover:-translate-y-0.5"
                style={btnStyle}>
                Go to Sign In <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="password" name="new_password" value={form.new_password} onChange={handle}
                    required minLength={8} placeholder="Min. 8 characters" className="form-input pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-muted">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="password" name="confirm_password" value={form.confirm_password} onChange={handle}
                    required minLength={8} placeholder="••••••••" className="form-input pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading || !token}
                className="w-full py-3 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-2"
                style={btnStyle}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          {!done && (
            <p className="mt-6 text-center text-[13px] text-text-muted">
              Back to{' '}
              <Link to="/login" className="font-bold text-brand-purple hover:underline">sign in →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
