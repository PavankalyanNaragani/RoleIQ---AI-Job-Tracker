import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Briefcase, Sparkles, Zap, Star, ShieldCheck,
  CheckCircle2, Globe, Cpu, Layout, Layers, Target, Award, Rocket,
  Search, FileText, ChevronRight, MessageSquare, Shield, Calendar
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const MODULES = [
  {
    id: 'forge',
    title: 'AI Resume Builder',
    subtitle: 'Tailored for Every Role',
    description: 'Our AI automatically rewrites and optimizes your resume for every job application, ensuring you pass ATS filters while highlighting your best skills.',
    icon: FileText,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.05)',
    features: ['Auto-Tailoring for JDs', 'Professional Templates', 'Skill Gap Analysis']
  },
  {
    id: 'oracle',
    title: 'Job Match Analysis',
    subtitle: 'Know Your Odds',
    description: 'Instantly scan job descriptions to see how well you match. Our AI identifies missing keywords and tells you exactly what to add to get an interview.',
    icon: Target,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.05)',
    features: ['ATS Compatibility Score', 'Keyword Extraction', 'Interview Probability']
  },
  {
    id: 'pulse',
    title: 'Application Tracker',
    subtitle: 'Stay Organized',
    description: 'Stop using spreadsheets. Track every job from applied to offer with a beautiful visual board. Get reminders for follow-ups and interviews.',
    icon: Layout,
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.05)',
    features: ['Visual Kanban Board', 'Interview Reminders', 'Success Analytics']
  }
]

const WORKFLOW = [
  { step: '01', title: 'Upload Resume', text: 'Upload your current resume and the job description you want to target.', icon: Search },
  { step: '02', title: 'AI Audit', text: 'Our AI analyzes the job requirements and identifies your matching score.', icon: Cpu },
  { step: '03', title: 'One-Click Tailor', text: 'Generate a perfectly optimized resume version specifically for that role.', icon: Sparkles },
  { step: '04', title: 'Track & Win', text: 'Monitor your application progress and land the interview.', icon: Rocket }
]

function SectionHeader({ overline, title, center = true }) {
  return (
    <div className={`mb-16 ${center ? 'text-center' : 'text-left'}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-purple mb-4">
        {overline}
      </p>
      <h2 className="text-4xl md:text-5xl font-black text-text-heading tracking-tight leading-tight">
        {title}
      </h2>
    </div>
  )
}

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-[#fafbff] selection:bg-brand-purple/10 selection:text-brand-purple">

      {/* ── Navbar ─────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-5 bg-white/70 backdrop-blur-2xl border-b border-brand-purple/5">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue shadow-lg shadow-brand-purple/25 transition-transform group-hover:rotate-12">
              <Zap size={18} className="text-white fill-current" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-lg font-black tracking-tighter text-text-heading uppercase">RoleIQ</span>
              <span className="text-[9px] font-black tracking-[0.2em] text-brand-purple uppercase">AI Career Intelligence</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'How it Works', 'Security'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, '')}`} className="text-[12px] font-bold text-text-muted hover:text-brand-purple uppercase tracking-widest transition-colors">
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-6 py-2.5 text-[12px] font-black uppercase tracking-widest text-text-heading hover:text-brand-purple transition-all">
              Login
            </Link>
            <Link to="/register" className="btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-brand-purple/20">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero Phase ────────────────────── */}
        <section className="relative pt-32 pb-24 px-6">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-blue/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 mx-auto max-w-[1400px]">
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-20 items-center">
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/5 border border-brand-purple/10 text-[10px] font-black uppercase tracking-[0.2em] text-brand-purple mb-10 shadow-sm">
                  <Sparkles size={14} /> AI-Powered Career Growth
                </div>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-text-heading leading-[0.95] tracking-tighter mb-8">
                  Know your fit. <br />
                  <span className="gradient-text">Land the role.</span>
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-12 max-w-xl font-medium">
                  Know your fit. Close the gaps. Land the role. The all-in-one AI platform to intelligently assess your career fit, analyze and improve your job search for every role, and land your next ideal position with clarity.</p>

                <div className="flex flex-wrap gap-5">
                  <Link to="/register" className="btn-primary px-10 py-5 text-base rounded-[24px]">
                    Get Started for Free <ArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="px-10 py-5 rounded-[24px] bg-white border border-brand-purple/10 text-[15px] font-bold text-text-heading shadow-sm hover:shadow-xl transition-all">
                    Explore Features
                  </Link>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-12 border-t border-brand-purple/5 pt-12">
                  {[
                    { val: '10x', label: 'Faster Process' },
                    { val: '94%', label: 'Match Accuracy' },
                    { val: '3.2x', label: 'More Interviews' }
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-3xl font-black text-text-heading tracking-tighter">{s.val}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1 opacity-60">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immersive Mockup */}
              <div className="relative hidden lg:block animate-fade-in pointer-events-none select-none">
                <div className="absolute inset-0 bg-brand-purple/20 blur-[100px] rounded-full scale-75 animate-pulse" />
                <div className="relative z-10 glass-card rounded-[48px] p-2 border-brand-purple/10 bg-white/50 backdrop-blur-xl shadow-2xl rotate-3">
                  <img
                    src="/dashboard-mockup.png"
                    alt="RoleIQ Dashboard Preview"
                    className="rounded-[40px] shadow-inner"
                  />

                  {/* Floating Micro-UI Cards: Dynamic Arc Layout */}

                  {/* Match Score - Anchor Top-Left */}
                  <div className="absolute -top-8 -left-32 glass-card p-5 rounded-[28px] shadow-2xl rotate-[-4deg] animate-bounce-slow border border-white/50 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-text-muted tracking-widest leading-none mb-1">Intelligence</p>
                        <p className="text-[15px] font-black text-text-heading">94% Match</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-32 bg-emerald-100/50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[94%] animate-pulse" />
                    </div>
                  </div>

                  {/* Pipeline - Anchor Top-Right */}
                  <div className="absolute top-[10%] -right-4 glass-card p-5 rounded-[28px] shadow-2xl rotate-[3deg] animate-bounce-slow border border-white/50 backdrop-blur-xl z-20" style={{ animationDelay: '0.7s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mb-1">Live Pipeline</p>
                        <p className="text-[14px] font-black text-text-heading whitespace-nowrap">3 Interviews Set</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Audit - Anchor Bottom-Right */}
                  <div className="absolute bottom-[15%] right-4 glass-card p-5 rounded-[28px] shadow-2xl rotate-[-2deg] animate-bounce-slow border border-white/50 backdrop-blur-xl z-20" style={{ animationDelay: '1.4s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mb-1">Neural Audit</p>
                        <p className="text-[14px] font-black text-text-heading whitespace-nowrap">Resume Optimized</p>
                      </div>
                    </div>
                  </div>

                  {/* ATS Shield - Anchor Bottom-Left */}
                  <div className="absolute -bottom-4 -left-16 glass-card p-5 rounded-[28px] shadow-2xl rotate-[2deg] animate-bounce-slow border border-white/50 backdrop-blur-xl z-20" style={{ animationDelay: '2.1s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mb-1">Security</p>
                        <p className="text-[14px] font-black text-text-heading whitespace-nowrap">ATS Shield Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Phase ─────────── */}
        <section id="features" className="py-32 px-6 bg-white">
          <div className="mx-auto max-w-[1400px]">
            <SectionHeader overline="Core Features" title="Everything you need to succeed." />

            <div className="grid lg:grid-cols-3 gap-8">
              {MODULES.map((m) => (
                <div key={m.id} className="group glass-card rounded-[40px] p-12 transition-all duration-500 hover:border-brand-purple/30">
                  <div
                    className="w-16 h-16 rounded-[24px] flex items-center justify-center mb-10 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: m.color, color: '#fff' }}
                  >
                    <m.icon size={28} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: m.color }}>
                    {m.subtitle}
                  </p>
                  <h3 className="text-3xl font-black text-text-heading mb-6 tracking-tight">{m.title}</h3>
                  <p className="text-text-muted leading-relaxed text-[15px] mb-10 font-medium opacity-80">
                    {m.description}
                  </p>

                  <div className="space-y-4 pt-8 border-t border-brand-purple/5">
                    {m.features.map(f => (
                      <div key={f} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand-purple/5 text-brand-purple">
                          <CheckCircle2 size={12} />
                        </div>
                        <span className="text-[12px] font-bold text-text-heading">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works Workflow ─────── */}
        <section id="howitworks" className="py-32 px-6 bg-[#f8f9ff]">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeader overline="How it Works" title="Four simple steps to hired." />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-purple/10 to-transparent z-0" />

              {WORKFLOW.map((w) => (
                <div key={w.step} className="relative z-10 text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-white border border-brand-purple/10 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-brand-purple/5 group hover:border-brand-purple transition-all duration-500">
                    <w.icon size={32} className="text-brand-purple group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-xs font-black text-brand-purple mb-3 tracking-widest">STEP {w.step}</p>
                  <h4 className="text-xl font-black text-text-heading mb-4 uppercase tracking-tighter">{w.title}</h4>
                  <p className="text-[13px] text-text-muted font-medium leading-relaxed px-4">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security ──────────────────── */}
        <section id="security" className="py-32 px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="glass-card rounded-[60px] p-20 grid lg:grid-cols-2 gap-20 items-center bg-gradient-to-br from-brand-purple to-brand-blue relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-white/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10">
                <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.4em] mb-6">Privacy & Trust</p>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-10">
                  Your data is safe with us.
                </h2>
                <div className="space-y-8">
                  {[
                    { icon: Shield, title: 'Secure Storage', text: 'We use industry-standard encryption to keep your resumes and personal data private.' },
                    { icon: MessageSquare, title: 'AI Ethics', text: 'Our models are trained to be objective and help you present your best self fairly.' },
                    { icon: Globe, title: 'Always Available', text: 'Access your job tracker and resumes from any device, anywhere in the world.' }
                  ].map(i => (
                    <div key={i.title} className="flex gap-6 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
                        <i.icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">{i.title}</h4>
                        <p className="text-white/70 text-sm leading-relaxed">{i.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 hidden lg:block">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Active Users', val: '24k+' },
                    { label: 'Resumes Built', val: '180k+' },
                    { label: 'Success Rate', val: '94%' },
                    { label: 'Happy Seekers', val: '99%' }
                  ].map(s => (
                    <div key={s.label} className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[40px] text-center">
                      <p className="text-4xl font-black text-white mb-2">{s.val}</p>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────── */}
        <section className="py-32 px-6">
          <div className="mx-auto max-w-4xl text-center">
            <SectionHeader overline="Join Today" title="Ready to land your next job?" />
            <p className="text-xl text-text-muted mb-12 max-w-2xl mx-auto font-medium">
              Start your journey with JobTracker today. It’s free to get started and takes less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary px-12 py-5 text-lg rounded-3xl w-full sm:w-auto shadow-2xl shadow-brand-purple/40">
                Get Started for Free <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="px-12 py-5 text-lg font-bold text-text-heading hover:text-brand-purple transition-all w-full sm:w-auto">
                Existing User Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-brand-purple/5 bg-white">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white">
                <Zap size={14} className="fill-current" />
              </div>
              <span className="text-sm font-black uppercase tracking-tighter text-text-heading">RoleIQ Intelligence</span>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              {['Terms', 'Privacy', 'About', 'Contact'].map(link => (
                <a key={link} href="#" className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] hover:text-brand-purple transition-colors">
                  {link}
                </a>
              ))}
            </div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.1em]">
              © 2026 RoleIQ AI Systems Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
