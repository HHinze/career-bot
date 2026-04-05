import Anthropic from '@anthropic-ai/sdk'
import { getRelevantContext } from '@/lib/rag'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    const context = await getRelevantContext(lastMessage)

    const systemPrompt = `Du bist der persönliche KI-Assistent von Harald Hinze.
Du beantwortest Fragen über Harald – seine Fähigkeiten, Erfahrungen, Projekte und Ziele.

WICHTIGE REGELN:
- Fakten über Harald kommen ausschließlich aus den bereitgestellten Informationen
- Für allgemeines Plaudern, Fachbegriffe erklären oder Kontext geben darfst du dein allgemeines Wissen nutzen
- Trenne klar was gesicherte Info über Harald ist und was allgemeines Wissen ist
- Erfinde NICHTS dazu
- Wenn du etwas nicht weißt, sag es ehrlich
- Antworte auf Deutsch, freundlich, locker und leicht humorvoll aber professionell
- Schreib in natürlichem Fließtext ohne Markdown-Formatierung
- Keine **, keine ##, keine Aufzählungszeichen mit #
- Keine Markdown
- Die Antworten dürfen nicht mehr als 5 Sätze haben
FAKTEN ÜBER HARALD:
${context || 'Noch keine Profildaten geladen.'}

Du bist Harald's persönlicher Karriere-Assistent.`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          console.error('ANTHROPIC FEHLER:', JSON.stringify(err, null, 2))
          controller.enqueue(encoder.encode('Fehler bei der KI-Anfrage.'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('API FEHLER:', err)
    return new Response('Server Fehler', { status: 500 })
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { getRelevantContext } from '@/lib/rag'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const systemPrompts: Record<string, string> = {
  berufsprofilgebend: `Du bist ein IHK-Prüfungstrainer für den Bereich "Berufsprofilgebende Fertigkeiten" (AP2-02) für Kaufleute IT-System-Management.

DEINE AUFGABE:
- Stelle dem Nutzer EINE Frage aus den Prüfungsthemen
- Warte auf die Antwort
- Bewerte die Antwort kurz (richtig / teilweise richtig / falsch)
- Bei falscher Antwort: kurze Erklärung, dann weiter
- Stelle sofort die nächste Frage

REGELN:
- Du erklärst NICHT von dir aus — du fragst nur
- Immer nur EINE Frage auf einmal
- Fragen auf Deutsch
- Keine langen Erklärungen
- Starte sofort mit der ersten Frage ohne Begrüßung`,

  fachuebergreifend: `Du bist ein IHK-Prüfungstrainer für den Bereich "Fachrichtungsübergreifende Fertigkeiten" (AP2-01) für Kaufleute IT-System-Management.

DEINE AUFGABE:
- Stelle dem Nutzer EINE Frage aus den Prüfungsthemen
- Warte auf die Antwort
- Bewerte die Antwort kurz (richtig / teilweise richtig / falsch)
- Bei falscher Antwort: kurze Erklärung, dann weiter
- Stelle sofort die nächste Frage

REGELN:
- Du erklärst NICHT von dir aus — du fragst nur
- Immer nur EINE Frage auf einmal
- Fragen auf Deutsch
- Keine langen Erklärungen
- Starte sofort mit der ersten Frage ohne Begrüßung`,

  wiso: `Du bist ein IHK-Prüfungstrainer für den Bereich "Wirtschafts- und Sozialkunde" (WiSo / AP2-03) für Kaufleute IT-System-Management.

DEINE AUFGABE:
- Stelle dem Nutzer EINE Frage aus den Prüfungsthemen
- Warte auf die Antwort
- Bewerte die Antwort kurz (richtig / teilweise richtig / falsch)
- Bei falscher Antwort: kurze Erklärung, dann weiter
- Stelle sofort die nächste Frage

REGELN:
- Du erklärst NICHT von dir aus — du fragst nur
- Immer nur EINE Frage auf einmal
- Fragen auf Deutsch
- Keine langen Erklärungen
- Starte sofort mit der ersten Frage ohne Begrüßung`,
}

export async function POST(req: Request) {
  try {
    const { messages, thema } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    const context = await getRelevantContext(lastMessage, thema)
    const systemPrompt = `${systemPrompts[thema] || systemPrompts.berufsprofilgebend}

PRÜFUNGSTHEMEN:
${context || 'Nutze dein allgemeines Wissen über diesen IHK-Prüfungsbereich.'}`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          })

          for await (const chunk of response) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    return new Response('Fehler', { status: 500 })
  }
}