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
    sub: 'AP2 – Teil 02',
    farbe: 'teal',
    themen: 'IT-Systeme · Beratung · Konzepte · Verträge · Marketing · Rechnungswesen',
    styles: {
      tab: 'border-[#1D9E75] text-[#085041] bg-[#E1F5EE]',
      tabInactive: 'text-gray-500 hover:text-[#1D9E75]',
      header: 'bg-[#E1F5EE]',
      headerText: 'text-[#04342C]',
      headerSub: 'text-[#0F6E56]',
      icon: 'bg-[#0F6E56]',
      iconStroke: '#9FE1CB',
      bubble: 'bg-[#E1F5EE] text-[#04342C]',
      button: 'bg-[#1D9E75] hover:bg-[#0F6E56] text-white',
    },
  },
  fachuebergreifend: {
    label: 'Fachübergreifend',
    sub: 'AP2 – Teil 01',
    farbe: 'purple',
    themen: 'Kundenberatung · IT-Lösungen · Qualitätssicherung · IT-Sicherheit',
    styles: {
      tab: 'border-[#7F77DD] text-[#26215C] bg-[#EEEDFE]',
      tabInactive: 'text-gray-500 hover:text-[#534AB7]',
      header: 'bg-[#EEEDFE]',
      headerText: 'text-[#26215C]',
      headerSub: 'text-[#534AB7]',
      icon: 'bg-[#534AB7]',
      iconStroke: '#CECBF6',
      bubble: 'bg-[#EEEDFE] text-[#26215C]',
      button: 'bg-[#534AB7] hover:bg-[#3C3489] text-white',
    },
  },
  wiso: {
    label: 'WiSo',
    sub: 'AP2 – Teil 03',
    farbe: 'amber',
    themen: 'Arbeitsrecht · Betrieb · Gesundheitsschutz · Umwelt · Zusammenarbeit',
    styles: {
      tab: 'border-[#EF9F27] text-[#412402] bg-[#FAEEDA]',
      tabInactive: 'text-gray-500 hover:text-[#854F0B]',
      header: 'bg-[#FAEEDA]',
      headerText: 'text-[#412402]',
      headerSub: 'text-[#854F0B]',
      icon: 'bg-[#854F0B]',
      iconStroke: '#FAC775',
      bubble: 'bg-[#FAEEDA] text-[#412402]',
      button: 'bg-[#BA7517] hover:bg-[#854F0B] text-white',
    },
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

  const t = themen[aktiv]
  const messages = chats[aktiv]

  useEffect(() => {
    if (messages.length === 0) {
      startBot()
    }
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
      setChats(prev => ({
        ...prev,
        [aktiv]: [{ role: 'assistant', content: text }],
      }))
    } catch {
      setChats(prev => ({
        ...prev,
        [aktiv]: [{ role: 'assistant', content: 'Fehler beim Laden. Bitte Seite neu laden.' }],
      }))
    }
    setLoading(false)
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
      setChats(prev => ({
        ...prev,
        [aktiv]: [...updated, { role: 'assistant', content: text }],
      }))
    } catch {
      setChats(prev => ({
        ...prev,
        [aktiv]: [...updated, { role: 'assistant', content: 'Fehler. Bitte erneut versuchen.' }],
      }))
    }
    setLoading(false)
  }

  function tabWechsel(thema: Thema) {
    setAktiv(thema)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-medium text-gray-900 mb-1">Prüfungstrainer</h1>
        <p className="text-gray-500 text-sm mb-6">IHK Abschlussprüfung – Kaufmann/Kauffrau IT-System-Management</p>

        <div className="flex gap-2 mb-4">
          {(Object.keys(themen) as Thema[]).map((key) => (
            <button
              key={key}
              onClick={() => tabWechsel(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                aktiv === key
                  ? themen[key].styles.tab + ' border'
                  : 'border-transparent ' + themen[key].styles.tabInactive
              }`}
            >
              {themen[key].label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          <div className={`${t.styles.header} px-5 py-4`}>
            <div className={`text-xs font-medium ${t.styles.headerSub} mb-0.5`}>{t.sub}</div>
            <div className={`text-base font-medium ${t.styles.headerText}`}>{t.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t.themen}</div>
          </div>

          <div ref={chatRef} className="h-96 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-5 py-3 rounded-2xl text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : t.styles.bubble
                  }`}
                >
                  {msg.role === 'assistant'
                    ? msg.content
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/\*/g, '')
                        .split('---')
                        .map((teil, i) => (
                          <p key={i} style={{ marginBottom: i === 0 ? '8px' : '0', fontWeight: i === 0 ? '500' : '400' }}>
                            {teil.trim()}
                          </p>
                        ))
                    : msg.content
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl ${t.styles.bubble}`}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && senden()}
              placeholder="Deine Antwort..."
              disabled={loading}
              className="flex-1 text-base px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 disabled:opacity-50"
            />
            <button
              onClick={senden}
              disabled={loading || !input.trim()}
              className={`px-4 py-2 rounded-xl text-base font-medium transition-colors disabled:opacity-40 ${t.styles.button}`}
            >
              Senden
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function TrainerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <TrainerContent />
    </Suspense>
  )
}