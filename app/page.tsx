import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main>
      <div className="header">
        <div className="avatar">HH</div>
        <div>
          <h1>Harald Hinze</h1>
          <p>Persönlicher KI-Assistent · Stellen Sie mir eine Frage</p>
        </div>
      </div>
      <ChatInterface />
    </main>
  )
}
