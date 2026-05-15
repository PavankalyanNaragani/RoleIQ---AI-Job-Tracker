import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, LoaderCircle, Zap } from 'lucide-react'
import { authAPI } from '../../api/auth'

export default function ActivatePage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'No token in URL.')

  useEffect(() => {
    if (!token) return
    authAPI.activate(token)
      .then((r) => { setStatus('success'); setMessage(r.data.message) })
      .catch((e) => { setStatus('error'); setMessage(e.response?.data?.error || 'Activation failed.') })
  }, [token])

  const btnStyle = {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #3b82f6)',
    boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-sans" style={{ background: '#f5f4ff' }}>
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-3xl p-10 text-center"
          style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>

          {/* Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <Zap size={22} className="text-white fill-current" />
          </div>

          {status === 'loading' && (
            <div>
              <LoaderCircle size={36} className="animate-spin mx-auto mb-4" style={{ color: '#7c3aed' }} />
              <p className="text-[14px] font-medium text-text-body">Activating your account…</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-text-heading mb-2">Account Activated!</h2>
              <p className="text-[13px] text-text-muted mb-7">{message}</p>
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-[14px] transition-all hover:-translate-y-0.5"
                style={btnStyle}>
                Go to Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#fff1f1', border: '1px solid rgba(239,68,68,0.25)' }}>
                <XCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-text-heading mb-2">Activation Failed</h2>
              <p className="text-[13px] text-red-500 mb-7">{message}</p>
              <Link to="/register" className="font-bold text-brand-purple text-[13px] hover:underline">
                Register again →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
