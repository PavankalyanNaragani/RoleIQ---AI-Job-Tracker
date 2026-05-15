import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen font-sans text-text-heading" style={{ background: '#f0f1ff' }}>
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-purple-100/50 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center">
              <span className="text-white font-black text-xs">RIQ</span>
            </div>
            <span className="font-bold text-sm tracking-tight">RoleIQ</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-brand-purple/5 text-brand-purple hover:bg-brand-purple/10 transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-5 sm:p-8 lg:p-10 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
