'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Thema = 'berufsprofilgebend' | 'fachuebergreifend' | 'wiso'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const themen = {
  berufsprofilgebend: {
    label: 'Berufsprofilgebend',
    farbe: '#1D9E75',
    farbeLicht: '#E1F5EE',
    farbeText: '#04342C',
  },
  fachuebergreifend: {
    label: 'Fachübergreifend',
    farbe: '#534AB7',
    farbeLicht: '#EEEDFE',
    farbeText: '#26215C',
  },
  wiso: {
    label: 'WiSo',
    farbe: '#BA7517',
    farbeLicht: '#FAEEDA',
    farbeText: '#412402',
  },
}

function TrainerContent() {
  const searchParams = useSearchParams()
  const initialThema = (searchParams.get('thema') as Thema) || 'berufsprofilgebend'

  const [aktiv, setAktiv] = useState<Thema>(initialThema)
  const [chats, setChats] = useState<Record<Thema, Message[]>>({
    berufsprofilgebend: [],
    fachuebergreifend: [],
    wiso: [],
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = themen[aktiv]
  const messages = chats[aktiv]

  useEffect(() => {
    if (messages.length === 0) startBot()
  }, [aktiv])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [chats])

  async function startBot() {
    setLoading(true)
    try {
      const res = await fetch('/api/trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Starte.' }],
          thema: aktiv,
        }),
      })
      const text = await res.text()
      setChats(prev => ({ ...prev, [aktiv]: [{ role: 'assistant', content: text }] }))
    } catch {
      setChats(prev => ({ ...prev, [aktiv]: [{ role: 'assistant', content: 'Fehler beim Laden.' }] }))
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  async function senden() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setChats(prev => ({ ...prev, [aktiv]: updated }))
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, thema: aktiv }),
      })
      const text = await res.text()
      setChats(prev => ({ ...prev, [aktiv]: [...updated, { role: 'assistant', content: text }] }))
    } catch {
      setChats(prev => ({ ...prev, [aktiv]: [...updated, { role: 'assistant', content: 'Fehler.' }] }))
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const clean = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*/g, '').trim()

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(Object.keys(themen) as Thema[]).map((key) => (
            <button
              key={key}
              onClick={() => setAktiv(key)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: `2px solid ${aktiv === key ? themen[key].farbe : '#e5e7eb'}`,
                background: aktiv === key ? themen[key].farbeLicht : 'white',
                color: aktiv === key ? themen[key].farbeText : '#888',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {themen[key].label}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>

          {/* Nachrichten */}
          <div ref={chatRef} style={{ height: '420px', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  background: msg.role === 'user' ? '#1a1a1a' : t.farbeLicht,
                  color: msg.role === 'user' ? 'white' : t.farbeText,
                }}>
                  {msg.role === 'assistant'
                    ? clean(msg.content).split('---').map((teil, j, arr) => (
                        <p key={j} style={{ margin: j < arr.length - 1 ? '0 0 10px 0' : '0' }}>
                          {teil.trim()}
                        </p>
                      ))
                    : msg.content
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: t.farbeLicht, borderRadius: '16px', width: 'fit-content' }}>
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: t.farbe, opacity: 0.5,
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${delay}ms`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && senden()}
              placeholder="Deine Antwort..."
              disabled={loading}
              style={{
                flex: 1, fontSize: '15px', padding: '10px 14px',
                borderRadius: '12px', border: '1px solid #e5e7eb',
                outline: 'none', background: 'white', color: '#111',
              }}
            />
            <button
              onClick={senden}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                background: t.farbe, color: 'white', fontSize: '15px',
                fontWeight: 600, cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >
              Senden
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </main>
  )
}

export default function TrainerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f9fafb' }} />}>
      <TrainerContent />
    </Suspense>
  )
}