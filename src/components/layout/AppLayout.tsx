'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import LangSwitcher from '@/components/ui/LangSwitcher'
import ChatBubble from '@/components/ai/ChatBubble'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="flex min-h-screen">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[55]" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-[60] transition-transform duration-300 shadow-2xl' : 'relative'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b sticky top-0"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', minHeight: '48px', zIndex: 30 }}>
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--color-text)' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="5" x2="18" y2="5"/>
                  <line x1="2" y1="10" x2="18" y2="10"/>
                  <line x1="2" y1="15" x2="18" y2="15"/>
                </svg>
              </button>
            )}
          </div>
          <LangSwitcher />
        </div>
        <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
          {children}
        </main>
      </div>
      <ChatBubble />
    </div>
  )
}
