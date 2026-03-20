'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    const root = document.documentElement
    const prev = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')
    root.style.colorScheme = 'light'
    return () => {
      if (prev) root.setAttribute('data-theme', prev)
      else root.removeAttribute('data-theme')
    }
  }, [])

  return (
    <div className="min-h-screen font-sans" style={{colorScheme:"light", backgroundColor:"#f8fafc", color:"#0f172a"}}>

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 shadow-sm sticky top-0 z-50" style={{backgroundColor:"#ffffff"}}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
          <span className="text-xl font-bold text-slate-800">Stillastock</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/signup" className="text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">Get Started</Link>
          <Link href="/login" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
            Login →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Smart POS & ERP System
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
            Manage your business{' '}
            <span className="text-blue-600">Smarter than ever.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            All-in-one POS & ERP system designed for local businesses. Control stock, accounting, and sales — all in one place.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Link href="/signup" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all">
              Get Started →
            </Link>
            <Link href="#features" className="px-6 py-4 text-slate-600 font-medium hover:text-blue-600 transition-colors">
              Learn more ↓
            </Link>
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-4">
            {/* Dashboard preview mockup */}
            <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="flex-1 bg-slate-700 rounded-full h-5 ml-2"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Revenue',val:'K 632,000',color:'bg-blue-500'},
                  {label:'Products',val:'124 SKUs',color:'bg-green-500'},
                  {label:'Receivables',val:'K 120,000',color:'bg-yellow-500'},
                  {label:'Expenses',val:'K 2,099',color:'bg-red-500'},
                ].map((card,i) => (
                  <div key={i} className="bg-slate-700 rounded-xl p-3">
                    <div className={`w-6 h-1 ${card.color} rounded-full mb-2`}></div>
                    <p className="text-slate-400 text-xs">{card.label}</p>
                    <p className="text-white font-bold text-sm mt-1">{card.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-700 rounded-xl p-3 mt-2">
                <p className="text-slate-400 text-xs mb-2">Top Products</p>
                {['Product A','Product B','Product C'].map((p,i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 bg-slate-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width:`${80-i*20}%`}}></div>
                    </div>
                    <span className="text-slate-400 text-xs w-16 text-right">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20" style={{backgroundColor:"#ffffff"}}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to run your business</h2>
            <p className="text-slate-500">Powerful features designed for Myanmar local businesses</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {icon:'🛒',title:'Smart POS',desc:'Fast checkout with customer tracking, price editing, and receipt printing.',color:'bg-blue-50 border-blue-100'},
              {icon:'📦',title:'Inventory Control',desc:'Real-time stock tracking with GRN, damaged stock, and sales return management.',color:'bg-green-50 border-green-100'},
              {icon:'💰',title:'Finance & Accounting',desc:'Track receivables, payables, bank accounts, and expenses automatically.',color:'bg-yellow-50 border-yellow-100'},
              {icon:'👥',title:'CRM',desc:'Manage customers and suppliers with credit balance tracking.',color:'bg-purple-50 border-purple-100'},
              {icon:'📊',title:'Reports & Analytics',desc:'Sales reports, profit analysis, and stock alerts in real-time.',color:'bg-red-50 border-red-100'},
              {icon:'🤖',title:'AI Insights (Coming Soon)',desc:'Smart business assistant powered by AI to help you make better decisions.',color:'bg-slate-50 border-slate-200'},
            ].map((f,i) => (
              <div key={i} className={`p-6 rounded-2xl border ${f.color} hover:shadow-md transition-all`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="text-5xl mb-6">🤖</div>
          <h2 className="text-3xl font-bold text-white mb-4">Meet your AI Business Assistant</h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            မကြာမီမှာပဲ သင့်ရဲ့ အရောင်းအဝယ် အခြေအနေတွေကို AI ကနေတစ်ဆင့် အနှစ်ချုပ် မေးမြန်းနိုင်တော့မှာပါ။
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-full text-sm font-medium border border-white/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Coming Soon
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{backgroundColor:"#f8fafc"}}>
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
          <p className="text-slate-500 mb-8">Join businesses already using Stillastock to manage their operations.</p>
          <Link href="/staff-login" className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all text-lg">
            Start Now — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-slate-400 py-10 px-8" style={{backgroundColor:"#0f172a"}}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-white font-semibold">Stillastock</span>
          </div>
          <p className="text-sm">© 2026 Stillastock. Smart POS & ERP for Local Businesses.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/staff-login" className="hover:text-white transition-colors">Staff Login</Link>
            <Link href="/login" className="hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
