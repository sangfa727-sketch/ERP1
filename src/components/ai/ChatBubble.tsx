'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  text: string
  time: string
  navigating?: boolean
}

const N8N_WEBHOOK = 'https://stailla.xyz/webhook/erp-chat'

export default function ChatBubble() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '👋 Stillastock ERP Assistant ပါ!\n\nရောင်းချမှု၊ stock၊ expenses report မေးနိုင်သည်။\nPage တစ်ခုသို့ သွားလိုလျှင်လည်း ပြောပါ 🙏', time: '' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => 'erp-' + Math.random().toString(36).slice(2))
  const bottomRef = useRef<HTMLDivElement>(null)
  const companyId = '38e7b287-fd4e-4354-a1d1-9efae0b09eb9'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const parseResponse = (raw: string) => {
    // Extract NAVIGATE: command
    const navMatch = raw.match(/NAVIGATE:\s*(\{[^}]+\})/i)
    let path: string | null = null
    let text = raw

    if (navMatch) {
      try {
        const nav = JSON.parse(navMatch[1])
        path = nav.path || null
      } catch {}
      // Remove NAVIGATE line from display text
      text = raw.replace(/NAVIGATE:\s*\{[^}]+\}/i, '').trim()
    }
    return { text, path }
  }

  const sendMessage = async (msg?: string) => {
    const userMsg = (msg || input).trim()
    if (!userMsg || loading) return
    setInput('')
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', text: userMsg, time: now }])
    setLoading(true)

    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: sessionId, company_id: companyId }),
      })
      const data = await res.json()
      const raw = data.reply || data.output || data.text || 'တုံ့ပြန်မှု မရပါ'
      const { text, path } = parseResponse(raw)
      const replyTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

      if (path) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: text || 'Page သို့ ခေါ်ဆောင်သွားမည်...',
          time: replyTime,
          navigating: true
        }])
        setTimeout(() => {
          router.push(path)
          setOpen(false)
        }, 1200)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text, time: replyTime }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ ချိတ်ဆက်မှု မအောင်မြင်ပါ', time: '' }])
    }
    setLoading(false)
  }

  const quickPrompts = [
    { label: 'ဒီနေ့ ရောင်းချမှု', msg: 'ဒီနေ့ ရောင်းချမှု ဘယ်လောက်ရှိလဲ' },
    { label: 'AR page', msg: 'AR page သွားမည်' },
    { label: 'Stock စစ်', msg: 'ကုန်လက်ကျန် နည်းနေတာတွေ ဘာတွေရှိလဲ' },
    { label: 'Expenses', msg: 'expenses page သွားမည်' },
  ]

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[100]"
          style={{ height: '500px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
              <div>
                <p className="font-bold text-sm">ERP Assistant</p>
                <p className="text-xs text-blue-100">Stillastock AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.navigating && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <span className="animate-spin">⟳</span> ခေါ်ဆောင်နေသည်...
                    </p>
                  )}
                  {msg.time && (
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {msg.time}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto flex-shrink-0">
            {quickPrompts.map(q => (
              <button key={q.label} onClick={() => sendMessage(q.msg)}
                className="flex-shrink-0 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs border border-blue-100 hover:bg-blue-100 whitespace-nowrap">
                {q.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <input type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="မေးချင်တာ ရိုက်ပါ..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-40 hover:bg-blue-700 transition-colors">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-[100] flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
        <span className="text-2xl">{open ? '✕' : '🤖'}</span>
      </button>
    </>
  )
}
