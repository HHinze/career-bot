import ChatInterface from '@/components/ChatInterface'
import Link from 'next/link'

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

      {/* Prüfungstrainer Sektion */}
      <section className="py-12 px-4">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Prüfungstrainer</h2>
        <p className="text-gray-500 text-sm mb-6">Bereite dich auf die IHK Abschlussprüfung vor</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              sub: 'AP2 – Teil 02',
              title: 'Berufsprofilgebend',
              themen: 'IT-Systeme · Beratung · Konzepte · Verträge',
              bg: 'bg-[#E1F5EE]',
              text: 'text-[#04342C]',
              sub_text: 'text-[#0F6E56]',
              border: 'border-[#5DCAA5]',
              btn: 'text-[#085041] border-[#5DCAA5]',
              tab: 'berufsprofilgebend',
            },
            {
              sub: 'AP2 – Teil 01',
              title: 'Fachübergreifend',
              themen: 'Kundenberatung · IT-Lösungen · IT-Sicherheit',
              bg: 'bg-[#EEEDFE]',
              text: 'text-[#26215C]',
              sub_text: 'text-[#534AB7]',
              border: 'border-[#AFA9EC]',
              btn: 'text-[#3C3489] border-[#AFA9EC]',
              tab: 'fachuebergreifend',
            },
            {
              sub: 'AP2 – Teil 03',
              title: 'WiSo',
              themen: 'Arbeitsrecht · Betrieb · Umwelt · Zusammenarbeit',
              bg: 'bg-[#FAEEDA]',
              text: 'text-[#412402]',
              sub_text: 'text-[#854F0B]',
              border: 'border-[#EF9F27]',
              btn: 'text-[#633806] border-[#EF9F27]',
              tab: 'wiso',
            },
          ].map((k) => (
            <Link
              key={k.tab}
              href="/trainer"
              className={`rounded-2xl border overflow-hidden block hover:scale-[1.02] transition-transform ${k.border}`}
            >
              <div className={`${k.bg} px-5 pt-4 pb-3`}>
                <div className={`text-xs font-medium ${k.sub_text} mb-0.5`}>{k.sub}</div>
                <div className={`text-base font-medium ${k.text}`}>{k.title}</div>
              </div>
              <div className="bg-white px-5 py-3">
                <div className="text-xs text-gray-400 mb-3">{k.themen}</div>
                <div className={`text-xs font-medium border rounded-lg px-3 py-1.5 text-center ${k.btn}`}>
                  Jetzt üben →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}