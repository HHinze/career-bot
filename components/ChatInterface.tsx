'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Warum passt Harald zu meiner Stelle?',
  'Was sind Haralds größte Stärken?',
  'Welche Projekte hat Harald umgesetzt?',
  'Wie kann ich Harald kontaktieren?',
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Haralds persönlicher KI-Assistent. Ich beantworte gerne alle Fragen über Harald – seine Erfahrungen, Fähigkeiten und Projekte. Was möchten Sie wissen?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: messageText },
    ]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMessage += decoder.decode(value)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantMessage },
        ])
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Es gab einen Fehler. Bitte versuche es erneut.' },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="chat-wrapper">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">
              {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggestions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} className="suggestion-btn">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Stellen Sie eine Frage über Harald..."
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          {loading ? '...' : 'Senden'}
        </button>
      </div>
    </div>
  )
}
