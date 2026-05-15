import { Link } from 'react-router-dom'
import { Construction, ArrowRight, Sparkles, Rocket, Zap } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'

export default function ComingSoonPage({ title, description, featureLabel }) {
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <section className="page-header mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Roadmap
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {description}
              </p>
            )}
          </div>
        </section>

        <div className="glass-card rounded-[40px] p-20 text-center max-w-3xl mx-auto relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          
          <div className="relative z-10">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] mb-8 shadow-xl shadow-brand-purple/10 bg-white border border-brand-purple/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Rocket size={40} className="text-brand-purple" />
            </div>
            
            <h2 className="text-3xl font-black text-text-heading mb-4 tracking-tight">Intelligence Module Under Construction</h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-lg mx-auto mb-10 font-medium">
              We are currently training our neural networks for this feature.
              The interface is live, but the backend implementation is being finalized to ensure optimal accuracy.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/dashboard" className="btn-primary px-10 py-4 shadow-2xl shadow-brand-purple/30">
                <ArrowRight size={18} /> Command Center
              </Link>
              <div className="px-6 py-4 rounded-2xl bg-brand-purple/5 text-brand-purple text-xs font-black uppercase tracking-widest border border-brand-purple/10 flex items-center gap-2">
                <Zap size={14} className="animate-pulse" /> Finalizing Node
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
