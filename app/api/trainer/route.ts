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
- Starte sofort mit der ersten Frage ohne Begrüßung
- Wähle Themen ZUFÄLLIG aus allen verfügbaren Bereichen
- Stelle NICHT zweimal hintereinander Fragen zum gleichen Thema
- Wechsle nach jeder Frage das Themengebiet`,

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